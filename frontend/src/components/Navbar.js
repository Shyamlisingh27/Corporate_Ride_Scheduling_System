import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getToken, getUserFromToken } from '../utils/auth';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getToken();
  const user = getUserFromToken();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <i>🚗</i>
          <span>RideScheduler Pro</span>
        </Link>
        
        <div className="navbar-nav">
          {token && (
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <i>📊</i> Dashboard
            </Link>
          )}
          
          {token && user && user.role === 'admin' && (
            <Link 
              to="/admin" 
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
            >
              <i>⚙️</i> Admin Panel
            </Link>
          )}
          
          {!token && (
            <>
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                <i>🔑</i> Sign In
              </Link>
              <Link to="/register" className="nav-button">
                <i>📝</i> Get Started
              </Link>
            </>
          )}
          
          {token && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name || 'User'}
              </span>
              <button onClick={handleLogout} className="nav-button secondary">
                <i>🚪</i> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;