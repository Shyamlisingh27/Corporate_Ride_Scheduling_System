import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { toast } from 'react-toastify';

function AdminPanel() {
  const [rides, setRides] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [filterPickup, setFilterPickup] = useState('');
  const [filterDrop, setFilterDrop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch all rides with filters and sorting
  const fetchRides = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterPickup) params.pickup = filterPickup;
      if (filterDrop) params.drop = filterDrop;
      if (filterStatus) params.status = filterStatus;
      if (filterUser) params.user = filterUser;
      if (filterDate) params.date = filterDate;
      params.sortBy = 'date';
      params.order = sortOrder;
      const res = await axios.get('/admin/rides', { params });
      setRides(res.data);
    } catch (err) {
      toast.error('Failed to fetch rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await axios.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      toast.error('Failed to fetch analytics. Please try again.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
    // eslint-disable-next-line
  }, [filterPickup, filterDrop, filterStatus, filterUser, filterDate, sortOrder]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Approve a ride
  const handleApprove = async (id) => {
    try {
      await axios.post(`/admin/rides/${id}/approve`);
      toast.success('✅ Ride approved successfully! User will be notified.');
      fetchRides();
      fetchAnalytics();
    } catch (err) {
      toast.error('Failed to approve ride. Please try again.');
    }
  };

  // Reject a ride
  const handleReject = async (id) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    try {
      await axios.post(`/admin/rides/${id}/reject`, { reason });
      toast.success('❌ Ride rejected successfully! User will be notified.');
      fetchRides();
      fetchAnalytics();
    } catch (err) {
      toast.error('Failed to reject ride. Please try again.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return 'status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'cancelled': return '🚫';
      case 'completed': return '🎉';
      default: return '⏳';
    }
  };

  return (
    <div className="container">
      <div className="main-content fade-in">
        <div className="hero">
          <h1>⚙️ Admin Dashboard</h1>
          <p>Comprehensive management and analytics for corporate ride scheduling</p>
        </div>

        {/* Analytics Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📊 System Analytics (Last 7 Days)</h2>
            <p className="card-subtitle">Real-time insights and performance metrics</p>
          </div>
          
          {analyticsLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <span className="loading-text">Loading analytics data...</span>
            </div>
          ) : (
            <div className="stats-grid">
              {analytics.map(a => (
                <div key={a._id} className="stat-card">
                  <div className="stat-number">{a.count}</div>
                  <div className="stat-label">{a._id} Rides</div>
                  <p className="text-sm text-gray-600 mt-2">
                    {a._id === 'pending' ? 'Awaiting approval' :
                     a._id === 'approved' ? 'Successfully approved' :
                     a._id === 'completed' ? 'Successfully completed' :
                     a._id === 'cancelled' ? 'Cancelled by users' : 'System processed'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Rides Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📋 All Ride Requests</h2>
            <p className="card-subtitle">Manage and monitor all corporate ride bookings</p>
          </div>
          
          {/* Filters */}
          <div className="filters">
            <div className="filter-group">
              <label>📍 Pickup:</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Filter by pickup location"
                value={filterPickup}
                onChange={e => setFilterPickup(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>🎯 Drop:</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Filter by destination"
                value={filterDrop}
                onChange={e => setFilterDrop(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>👤 User:</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Filter by user name or email"
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>📅 Date:</label>
              <input
                type="date"
                className="filter-input"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>📊 Status:</label>
              <select
                className="filter-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>📅 Sort:</label>
              <select
                className="filter-select"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Rides Table */}
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <span className="loading-text">Loading ride requests...</span>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>📍 Pickup</th>
                    <th>🎯 Drop</th>
                    <th>📅 Date & Time</th>
                    <th>🚗 Vehicle</th>
                    <th>👤 User</th>
                    <th>📊 Status</th>
                    <th>⚡ Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        <i>🚗</i>
                        <h3>No ride requests found</h3>
                        <p>All ride requests have been processed or no new requests available.</p>
                      </td>
                    </tr>
                  ) : (
                    rides.map(ride => (
                      <tr key={ride._id}>
                        <td>{ride.pickup}</td>
                        <td>{ride.drop}</td>
                        <td>{new Date(ride.date).toLocaleString()}</td>
                        <td>
                          <span className="text-sm font-medium">
                            {ride.vehicle?.type || 'Sedan'}
                          </span>
                        </td>
                        <td>
                          <div className="text-sm">
                            <div className="font-medium">{ride.user?.name || 'Unknown'}</div>
                            <div className="text-gray-500">{ride.user?.email || 'No email'}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(ride.status)}`}>
                            {getStatusIcon(ride.status)} {ride.status}
                          </span>
                        </td>
                        <td>
                          {ride.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleApprove(ride._id)}
                                className="btn btn-success"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                              >
                                <i>✅</i> Approve
                              </button>
                              <button 
                                onClick={() => handleReject(ride._id)}
                                className="btn btn-danger"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                              >
                                <i>❌</i> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">No actions available</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">⚡ Quick Actions</h2>
            <p className="card-subtitle">Common administrative tasks</p>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
            >
              <i>🔄</i> Refresh Data
            </button>
            <button 
              onClick={() => fetchAnalytics()}
              className="btn btn-outline"
            >
              <i>📊</i> Update Analytics
            </button>
            <button 
              onClick={() => {
                setFilterStatus('');
                setFilterUser('');
                setFilterDate('');
                setFilterPickup('');
                setFilterDrop('');
              }}
              className="btn btn-ghost"
            >
              <i>🧹</i> Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;