import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please try again.');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post('/users/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      toast.success('🎉 Account created successfully! Welcome to RideScheduler Pro!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="main-content fade-in">
        <div className="hero">
          <h1>🚗 Join RideScheduler Pro</h1>
          <p>Experience the future of corporate transportation management</p>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📝 Create Your Account</h2>
            <p className="card-subtitle">Get started with our advanced ride scheduling platform</p>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="form-group">
              <label className="form-label">👤 Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">📧 Corporate Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your corporate email address"
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
                placeholder="Create a strong password (min. 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">🔐 Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
                  Creating Account...
                </>
              ) : (
                <>
                  <i>🚀</i>
                  Create Account & Get Started
                </>
              )}
            </button>
          </form>
          
          <div className="text-center mt-5 pt-4 border-t border-gray-200">
            <p className="text-gray-600 mb-3">
              Already have an account? 
            </p>
            <Link to="/login" className="btn btn-outline">
              <i>🔑</i>
              Sign In to Existing Account
            </Link>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="stats-grid mt-5">
          <div className="stat-card">
            <div className="stat-number">⚡</div>
            <div className="stat-label">Quick Setup</div>
            <p className="text-sm text-gray-600 mt-2">Get started in minutes with our streamlined onboarding</p>
          </div>
          <div className="stat-card">
            <div className="stat-number">🛡️</div>
            <div className="stat-label">Enterprise Security</div>
            <p className="text-sm text-gray-600 mt-2">Bank-level security with encrypted data protection</p>
          </div>
          <div className="stat-card">
            <div className="stat-number">📊</div>
            <div className="stat-label">Advanced Analytics</div>
            <p className="text-sm text-gray-600 mt-2">Comprehensive reporting and insights for your rides</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;