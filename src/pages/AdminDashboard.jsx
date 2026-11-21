import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getPendingEvents } from '../services/adminService';
import { approveEvent, rejectEvent } from '../services/eventService';
import { getAllUsers, banUser, unbanUser } from '../services/userService';
import { signOut } from '../services/authService';
import { Users, Calendar, DollarSign, Clock, Check, X, Shield, LogOut, User as UserIcon } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatDate';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    if (!user || user.role !== 'admin') {
      return;
    }

    try {
      const statsResult = await getAdminStats();
      if (statsResult.success) {
        setStats(statsResult.stats);
        setPendingEvents(statsResult.pendingEvents);
      }

      const usersResult = await getAllUsers();
      if (usersResult.success) {
        setAllUsers(usersResult.users);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    const result = await approveEvent(eventId);
    if (result.success) {
      setPendingEvents(pendingEvents.filter(e => e.id !== eventId));
      loadAdminData();
    }
  };

  const handleRejectEvent = async (eventId) => {
    const result = await rejectEvent(eventId);
    if (result.success) {
      setPendingEvents(pendingEvents.filter(e => e.id !== eventId));
      loadAdminData();
    }
  };

  const handleBanUser = async (userId) => {
    const result = await banUser(userId);
    if (result.success) {
      loadAdminData();
    }
  };

  const handleUnbanUser = async (userId) => {
    const result = await unbanUser(userId);
    if (result.success) {
      loadAdminData();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkerBlue flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-darkerBlue flex items-center justify-center">
        <div className="text-white">Access Denied</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkerBlue">
      {/* Header */}
      <header className="bg-darkBlue border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gold">Chandara VR - Admin</Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold" />
              <span className="text-white">Admin Panel</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'overview' 
                ? 'text-gold border-b-2 border-gold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'events' 
                ? 'text-gold border-b-2 border-gold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Event Approvals
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'users' 
                ? 'text-gold border-b-2 border-gold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            User Management
          </button>
        </div>

        {activeTab === 'overview' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Events</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalEvents || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats?.totalRevenue || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Pending Approvals</p>
                    <p className="text-2xl font-bold text-white">{stats?.pendingEventsCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Commission */}
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">Platform Commission</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Commission Earned (10%)</p>
                  <p className="text-3xl font-bold text-gold">{formatCurrency(stats?.platformCommission || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Revenue Split</p>
                  <p className="text-white">90% Streamer / 10% Platform</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Pending Event Approvals</h2>
            {pendingEvents.length === 0 ? (
              <div className="card text-center py-12">
                <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No pending events to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingEvents.map(event => (
                  <EventApprovalCard 
                    key={event.id} 
                    event={event} 
                    onApprove={handleApproveEvent}
                    onReject={handleRejectEvent}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">User Management</h2>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-800">
                    <th className="pb-4">User</th>
                    <th className="pb-4">Email</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Country</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(userItem => (
                    <tr key={userItem.id} className="border-b border-gray-800">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-black font-bold">
                            {userItem.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-white">{userItem.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-400">{userItem.email}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          userItem.role === 'admin' ? 'bg-purple-600 text-white' :
                          userItem.role === 'streamer' ? 'bg-blue-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {userItem.role}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">{userItem.country}</td>
                      <td className="py-4">
                        {userItem.isBanned ? (
                          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">Banned</span>
                        ) : (
                          <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">Active</span>
                        )}
                      </td>
                      <td className="py-4">
                        {userItem.isBanned ? (
                          <button
                            onClick={() => handleUnbanUser(userItem.id)}
                            className="text-green-400 hover:text-green-300 text-sm font-semibold"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(userItem.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-semibold"
                          >
                            Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EventApprovalCard = ({ event, onApprove, onReject }) => {
  return (
    <div className="card">
      <div className="flex flex-col md:flex-row gap-4">
        {event.thumbnail ? (
          <img src={event.thumbnail} alt={event.title} className="w-full md:w-48 h-32 object-cover rounded-lg" />
        ) : (
          <div className="w-full md:w-48 h-32 bg-gradient-to-br from-darkBlue to-darkerBlue rounded-lg flex items-center justify-center">
            <Calendar className="w-12 h-12 text-gold" />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white text-lg">{event.title}</h3>
              <p className="text-gray-400 text-sm">{event.sport} • {event.city}, {event.country}</p>
            </div>
            <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-semibold">PENDING</span>
          </div>
          
          <p className="text-gray-300 text-sm mb-3">{event.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
            <span>Date: {formatDateTime(event.date)}</span>
            <span>Price: ${event.ticketPrice}</span>
            <span>Camera: {event.cameraType}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onApprove(event.id)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onReject(event.id)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
