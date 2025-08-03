const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With',  'x-auth-token']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
const { requestLogger } = require('./middleware/auth');
app.use(requestLogger);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', globalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Test authentication endpoint
app.get('/api/test-auth', (req, res) => {
  console.log('Test auth endpoint called');
  console.log('Headers:', req.headers);
  res.status(200).json({
    message: 'Test endpoint reached',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Protected test endpoint
const { auth } = require('./middleware/auth');
app.get('/api/test-protected', auth, (req, res) => {
  res.status(200).json({
    message: 'Protected endpoint reached successfully',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Debug environment variables (remove in production)
app.get('/api/debug-env', (req, res) => {
  res.status(200).json({
    jwt_secret_exists: !!process.env.JWT_SECRET,
    jwt_secret_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes
const userRoutes = require('./routes/userRoutes');
const rideRoutes = require('./routes/rideRoutes');
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pricingRoutes = require('./routes/pricingRoutes');

app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pricing', pricingRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Corporate Ride Scheduling System API',
    version: '2.0.0',
    status: 'Active',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      error: `${field} already exists`,
      code: 'DUPLICATE_KEY',
      field: field
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // Rate limit errors
  if (error.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
  
  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;