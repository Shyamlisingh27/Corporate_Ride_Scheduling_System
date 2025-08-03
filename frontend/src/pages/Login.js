import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/users/login', { email, password });
      console.log('Login response:', res.data);
      localStorage.setItem('token', res.data.token);
      console.log('Token stored:', res.data.token.substring(0, 20) + '...');
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success('🎉 Welcome back! You have successfully signed in.');
      // if (res.data.user.role === 'admin') {
      //   navigate('/admin');
      // } else {
      //   navigate('/dashboard');
      // }
      const user = res.data.user;
      setTimeout(() => {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      }, 100);

      
      if (user.role === 'admin') {
        console.log("🛡️ Admin logged in");
      } else if (user.role === 'user') {
        console.log("👤 User logged in");
      }

      //navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign in failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="main-content fade-in">
        <div className="hero">
          <h1>🚗 Welcome to RideScheduler Pro</h1>
          <p>Streamline your corporate transportation with our advanced ride scheduling platform</p>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🔑 Sign In to Your Account</h2>
            <p className="card-subtitle">Access your dashboard and manage your rides</p>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="form-group">
              <label className="form-label">📧 Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your corporate email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">🔒 Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                  Signing In...
                </>
              ) : (
                <>
                  <i>🚀</i>
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>
          
          <div className="text-center mt-5 pt-4 border-t border-gray-200">
            <p className="text-gray-600 mb-3">
              Don't have an account yet? 
            </p>
            <Link to="/register" className="btn btn-outline">
              <i>📝</i>
              Create New Account
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="stats-grid mt-5">
          <div className="stat-card">
            <div className="stat-number">🚗</div>
            <div className="stat-label">Smart Booking</div>
            <p className="text-sm text-gray-600 mt-2">Intelligent ride scheduling with real-time availability</p>
          </div>
          <div className="stat-card">
            <div className="stat-number">⚡</div>
            <div className="stat-label">Instant Approval</div>
            <p className="text-sm text-gray-600 mt-2">Automated approval system for seamless experience</p>
          </div>
          <div className="stat-card">
            <div className="stat-number">📱</div>
            <div className="stat-label">Real-time Updates</div>
            <p className="text-sm text-gray-600 mt-2">Live tracking and notifications for your rides</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;