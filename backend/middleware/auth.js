const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const { RedisStore } = require('rate-limit-redis');

// Redis client for session management and rate limiting
// Disable Redis for now - set to null to use memory-based rate limiting
let redis = null;
console.log('Running without Redis - using memory-based rate limiting');

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  const config = {
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  };
  
  // Use Redis store if available, otherwise use default memory store
  if (redis) {
    config.store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: 'rate_limit:'
    });
  }
  
  return rateLimit(config);
};

// Different rate limiters for different endpoints
const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many login attempts. Please try again later.'
);

const apiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100, // 100 requests per minute
  'Too many requests. Please try again later.'
);

const rideBookingLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 ride bookings per minute
  'Too many ride booking attempts. Please try again later.'
);

// Enhanced authentication middleware
const auth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    // Check if Authorization header exists and has Bearer token
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    } else {
      // If no Authorization header or no Bearer token, check x-auth-token
      token = req.header('x-auth-token');
    }
    
    if (!token) {
      console.log('Auth failed: No token provided');
      console.log('Headers:', req.headers);
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Check if token is blacklisted (only if Redis is available)
    if (redis) {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({ 
          error: 'Token has been invalidated.',
          code: 'TOKEN_BLACKLISTED'
        });
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('JWT decoded successfully:', { id: decoded.id, iat: decoded.iat });
    
    // Get user with enhanced security checks
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('profile.manager', 'name email');
    
    console.log('User lookup result:', { 
      found: !!user, 
      userId: decoded.id, 
      isActive: user?.isActive,
      isLocked: user?.isLocked,
      lockUntil: user?.lockUntil
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if account is locked (handle both virtual and direct property)
    const isLocked = user.isLocked || (user.lockUntil && user.lockUntil > Date.now());
    if (isLocked) {
      return res.status(401).json({ 
        error: 'Account is temporarily locked due to multiple failed login attempts.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Check if password was changed after token was issued
    if (user.lastPasswordChange) {
      if (decoded.pwdChangedAt) {
        // Use the pwdChangedAt field from the token for accurate comparison
        const currentPasswordChangeTime = user.lastPasswordChange.getTime() / 1000;
        const tokenPasswordChangeTime = decoded.pwdChangedAt;
        
        console.log('Password change check (new method):', {
          currentPasswordChangeTime,
          tokenPasswordChangeTime,
          passwordsMatch: currentPasswordChangeTime === tokenPasswordChangeTime
        });
        
        // If the password change time in the token doesn't match the current password change time,
        // it means the password was changed after the token was issued
        if (currentPasswordChangeTime !== tokenPasswordChangeTime) {
          return res.status(401).json({ 
            error: 'Password has been changed. Please login again.',
            code: 'PASSWORD_CHANGED'
          });
        }
      } else {
        // Fallback for old tokens that don't have pwdChangedAt field
        // Add a small buffer (5 seconds) to handle timing differences during user creation
        if (decoded.iat) {
          const passwordChangeTime = user.lastPasswordChange.getTime() / 1000;
          const tokenIssuedTime = decoded.iat;
          const timeDifference = passwordChangeTime - tokenIssuedTime;
          
          console.log('Password change check (fallback):', {
            passwordChangeTime,
            tokenIssuedTime,
            timeDifference,
            willReject: timeDifference > 5
          });
          
          // Only consider it a password change if it happened more than 5 seconds after token issuance
          if (timeDifference > 5) {
            return res.status(401).json({ 
              error: 'Password has been changed. Please login again.',
              code: 'PASSWORD_CHANGED'
            });
          }
        }
      }
    }

    // Update last activity
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Store user info in request
    req.user = user;
    req.token = token;
    
    // Add user session to Redis for tracking (only if Redis is available)
    if (redis) {
      await redis.setex(`session:${user._id}:${token}`, 24 * 60 * 60, JSON.stringify({
        userId: user._id,
        email: user.email,
        role: user.role,
        lastActivity: new Date().toISOString()
      }));
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token has expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Internal server error.',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Manager authorization - users can only access their own data or their subordinates
const managerAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admins can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Managers can access their own data and their subordinates
    if (req.user.role === 'manager') {
      const targetUserId = req.params.userId || req.body.userId;
      
      if (targetUserId) {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
          return res.status(404).json({ 
            error: 'User not found.',
            code: 'USER_NOT_FOUND'
          });
        }

        // Check if target user is under this manager
        if (targetUser.profile.manager?.toString() !== req.user._id.toString()) {
          return res.status(403).json({ 
            error: 'Access denied. You can only access your subordinates\' data.',
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }
      }
    }

    // Regular users can only access their own data
    if (req.user.role === 'user') {
      const targetUserId = req.params.userId || req.body.userId;
      
      if (targetUserId && targetUserId !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied. You can only access your own data.',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Manager auth error:', error);
    res.status(500).json({ 
      error: 'Internal server error.',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Session management middleware
const sessionAuth = async (req, res, next) => {
  try {
    if (!req.user || !req.token) {
      return res.status(401).json({ 
        error: 'Session not found.',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Check if session exists in Redis (only if Redis is available)
    if (redis) {
      const sessionKey = `session:${req.user._id}:${req.token}`;
      const session = await redis.get(sessionKey);
      
      if (!session) {
        return res.status(401).json({ 
          error: 'Session expired.',
          code: 'SESSION_EXPIRED'
        });
      }

      // Update session activity
      const sessionData = JSON.parse(session);
      sessionData.lastActivity = new Date().toISOString();
      await redis.setex(sessionKey, 24 * 60 * 60, JSON.stringify(sessionData));
    }

    next();
  } catch (error) {
    console.error('Session auth error:', error);
    res.status(500).json({ 
      error: 'Internal server error.',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Logout middleware
const logout = async (req, res, next) => {
  try {
    if (req.token && redis) {
      // Blacklist the token
      await redis.setex(`blacklist:${req.token}`, 24 * 60 * 60, 'true');
      
      // Remove session
      if (req.user) {
        await redis.del(`session:${req.user._id}:${req.token}`);
      }
    }
    next();
  } catch (error) {
    console.error('Logout error:', error);
    next();
  }
};

// Activity tracking middleware
const trackActivity = async (req, res, next) => {
  try {
    if (req.user && redis) {
      // Track user activity
      await redis.setex(`activity:${req.user._id}`, 60 * 60, JSON.stringify({
        lastActivity: new Date().toISOString(),
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      }));
    }
    next();
  } catch (error) {
    console.error('Activity tracking error:', error);
    next();
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id
    };
    
    console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} ${logData.status} ${logData.duration}`);
  });
  
  next();
};

module.exports = {
  auth,
  authorize,
  managerAuth,
  sessionAuth,
  logout,
  trackActivity,
  requestLogger,
  loginLimiter,
  apiLimiter,
  rideBookingLimiter
};