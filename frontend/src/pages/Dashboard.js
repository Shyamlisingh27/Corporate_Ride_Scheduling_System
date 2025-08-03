import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { toast } from 'react-toastify';

function Dashboard() {
  const [rides, setRides] = useState([]);
  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    pendingRides: 0,
    cancelledRides: 0
  });
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [date, setDate] = useState('');
  const [vehicleType, setVehicleType] = useState('sedan');
  const [rideType, setRideType] = useState('one-way');
  const [filterPickup, setFilterPickup] = useState('');
  const [filterDrop, setFilterDrop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch user's rides with filters and sorting
  const fetchRides = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterPickup) params.pickup = filterPickup;
      if (filterDrop) params.drop = filterDrop;
      if (filterStatus) params.status = filterStatus;
      params.sortBy = 'date';
      params.order = sortOrder;
      const res = await axios.get('/rides', { params });
      
      setRides(res.data);
      
      // Calculate stats
      const totalRides = res.data.length;
      const completedRides = res.data.filter(ride => ride.status === 'completed').length;
      const pendingRides = res.data.filter(ride => ride.status === 'pending').length;
      const cancelledRides = res.data.filter(ride => ride.status === 'cancelled').length;
      
      setStats({
        totalRides,
        completedRides,
        pendingRides,
        cancelledRides
      });
    } catch (err) {
      toast.error('Failed to fetch rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
    // eslint-disable-next-line
  }, [filterPickup, filterDrop, filterStatus, sortOrder]);

  // Book a new ride
  const handleBook = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      const rideData = {
        pickup,
        drop,
        date,
        vehicleType,
        rideType
      };
      
      console.log('Sending ride data:', rideData);
      await axios.post('/rides', rideData);
      toast.success('🚗 Ride booked successfully! You will receive a confirmation shortly.');
      setPickup('');
      setDrop('');
      setDate('');
      setVehicleType('sedan');
      setRideType('one-way');
      fetchRides();
    } catch (err) {
      console.error('Booking error:', err.response?.data);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Cancel a ride
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;
    try {
      await axios.delete(`/rides/${id}`);
      toast.success('✅ Ride cancelled successfully');
      fetchRides();
    } catch (err) {
      toast.error('Failed to cancel ride. Please try again.');
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
          <h1>🚗 Your Ride Dashboard</h1>
          <p>Manage your corporate rides with our advanced scheduling platform</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid mb-5">
          <div className="stat-card">
            <div className="stat-number">{stats.totalRides}</div>
            <div className="stat-label">Total Rides</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.completedRides}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.pendingRides}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.cancelledRides}</div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>

        {/* Book a Ride Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📅 Book a New Ride</h2>
            <p className="card-subtitle">Schedule your next corporate transportation</p>
          </div>
          
          <form onSubmit={handleBook}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">📍 Pickup Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter pickup address"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">🎯 Drop Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter destination address"
                  value={drop}
                  onChange={e => setDrop(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">📅 Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">🚗 Vehicle Type</label>
                <select
                  className="form-input"
                  value={vehicleType}
                  onChange={e => setVehicleType(e.target.value)}
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="luxury">Luxury</option>
                  <option value="van">Van</option>
                  <option value="bus">Bus</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">🔄 Ride Type</label>
                <select
                  className="form-input"
                  value={rideType}
                  onChange={e => setRideType(e.target.value)}
                >
                  <option value="one-way">One Way</option>
                  <option value="round-trip">Round Trip</option>
                  <option value="recurring">Recurring</option>
                  <option value="emergency">Emergency</option>
                  <option value="airport-transfer">Airport Transfer</option>
                </select>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                  Booking Ride...
                </>
              ) : (
                <>
                  <i>🚀</i>
                  Book Ride Now
                </>
              )}
            </button>
          </form>
        </div>

        {/* Your Rides Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📋 Your Ride History</h2>
            <p className="card-subtitle">View and manage all your scheduled rides</p>
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
              <span className="loading-text">Loading your rides...</span>
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
                    <th>📊 Status</th>
                    <th>⚡ Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        <i>🚗</i>
                        <h3>No rides found</h3>
                        <p>Book your first ride above to get started!</p>
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
                          <span className={`status-badge ${getStatusBadgeClass(ride.status)}`}>
                            {getStatusIcon(ride.status)} {ride.status}
                          </span>
                        </td>
                        <td>
                          {(ride.status === 'pending' || ride.status === 'approved') ? (
                            <button 
                              onClick={() => handleCancel(ride._id)}
                              className="btn btn-danger"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            >
                              <i>❌</i> Cancel
                            </button>
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
      </div>
    </div>
  );
}

export default Dashboard;