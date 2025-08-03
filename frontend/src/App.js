import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';

import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <div className="container">
              <div className="main-content fade-in">
                <div className="hero">
                  <h1>🚗 RideScheduler Pro</h1>
                  <p>Enterprise-grade corporate transportation management platform</p>
                </div>
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">⚡</div>
                    <div className="stat-label">Smart Booking</div>
                    <p className="text-sm text-gray-600 mt-2">Intelligent ride scheduling with real-time availability and dynamic pricing</p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">🛡️</div>
                    <div className="stat-label">Enterprise Security</div>
                    <p className="text-sm text-gray-600 mt-2">Bank-level security with encrypted data protection and role-based access</p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">📊</div>
                    <div className="stat-label">Advanced Analytics</div>
                    <p className="text-sm text-gray-600 mt-2">Comprehensive reporting and insights for optimized transportation management</p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">🔔</div>
                    <div className="stat-label">Smart Notifications</div>
                    <p className="text-sm text-gray-600 mt-2">Multi-channel notifications with intelligent scheduling and delivery tracking</p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">🚀 Get Started Today</h2>
                    <p className="card-subtitle">Join thousands of companies using RideScheduler Pro</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Experience the future of corporate transportation with our advanced platform.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                      <a href="/login" className="btn btn-primary">
                        <i>🔑</i> Sign In
                      </a>
                      <a href="/register" className="btn btn-outline">
                        <i>📝</i> Create Account
                      </a>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">✨ Why Choose RideScheduler Pro?</h2>
                    <p className="card-subtitle">Built for modern enterprises</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2">🎯</div>
                      <h3 className="font-semibold mb-2">Precision Scheduling</h3>
                      <p className="text-sm text-gray-600">Advanced algorithms ensure optimal ride scheduling with real-time adjustments</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2">💰</div>
                      <h3 className="font-semibold mb-2">Cost Optimization</h3>
                      <p className="text-sm text-gray-600">Dynamic pricing and corporate discounts help reduce transportation costs</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2">📱</div>
                      <h3 className="font-semibold mb-2">Mobile First</h3>
                      <p className="text-sm text-gray-600">Responsive design works seamlessly across all devices and platforms</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2">🔒</div>
                      <h3 className="font-semibold mb-2">Data Protection</h3>
                      <p className="text-sm text-gray-600">Enterprise-grade security with GDPR compliance and data encryption</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2">🚀</div>
                      <h3 className="font-semibold mb-2">Scalable Platform</h3>
                      <p className="text-sm text-gray-600">Built to handle growing organizations with unlimited scalability</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2">🎨</div>
                      <h3 className="font-semibold mb-2">Modern UI/UX</h3>
                      <p className="text-sm text-gray-600">Intuitive interface designed for maximum productivity and user satisfaction</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastStyle={{
            borderRadius: '12px',
            fontFamily: 'var(--font-family)',
            fontSize: '14px'
          }}
        />
      </div>
    </Router>
  );
}

export default App;