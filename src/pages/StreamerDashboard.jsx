import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvents } from '../services/eventService';
import { getStreamerRevenue } from '../services/ticketService';
import { signOut } from '../services/authService';
import { DollarSign, Ticket, Calendar, Plus, LogOut, User, Video } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatDate';

const StreamerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [revenue, setRevenue] = useState({ totalRevenue: 0, ticketsSold: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreamerData();
  }, [user]);

  const loadStreamerData = async () => {
    if (!user) return;

    try {
      const eventsResult = await getEvents({ ownerId: user.uid });
      if (eventsResult.success) {
        setEvents(eventsResult.events);
      }

      const revenueResult = await getStreamerRevenue(user.uid);
      if (revenueResult.success) {
        setRevenue(revenueResult);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading streamer data:', error);
      setLoading(false);
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

  const liveEvents = events.filter(e => e.status === 'live');
  const upcomingEvents = events.filter(e => e.status === 'approved');

  return (
    <div className="min-h-screen bg-darkerBlue">
      {/* Header */}
      <header className="bg-darkBlue border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gold">Chandara VR</Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-white">{user?.name}</span>
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Streamer Dashboard</h1>
          <Link to="/create-event" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Event
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(revenue.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                <Ticket className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Tickets Sold</p>
                <p className="text-2xl font-bold text-white">{revenue.ticketsSold}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Live Events</p>
                <p className="text-2xl font-bold text-white">{liveEvents.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Upcoming Events</p>
                <p className="text-2xl font-bold text-white">{upcomingEvents.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Events */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Live Events</h2>
          {liveEvents.length === 0 ? (
            <div className="card text-center py-12">
              <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No live events at the moment</p>
              <Link to="/create-event" className="btn-primary inline-block">
                Start Streaming
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveEvents.map(event => (
                <EventCard key={event.id} event={event} isStreamer />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No upcoming events</p>
              <Link to="/create-event" className="btn-primary inline-block">
                Create Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} isStreamer />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EventCard = ({ event, isStreamer }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-600';
      case 'approved': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <Link to={`/event/${event.id}`} className="block">
      <div className="card overflow-hidden group hover:border-gold transition-all">
        {event.thumbnail ? (
          <img src={event.thumbnail} alt={event.title} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-darkBlue to-darkerBlue flex items-center justify-center">
            <Video className="w-12 h-12 text-gold" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-gold text-black px-2 py-1 rounded font-semibold">
              {event.sport}
            </span>
            <span className={`text-xs text-white px-2 py-1 rounded font-semibold ${getStatusColor(event.status)}`}>
              {event.status.toUpperCase()}
            </span>
          </div>
          <h3 className="font-semibold text-white mb-2">{event.title}</h3>
          <p className="text-gray-400 text-sm mb-2">{event.city}, {event.country}</p>
          <p className="text-gray-400 text-sm mb-2">{formatDateTime(event.date)}</p>
          <div className="flex justify-between items-center">
            <span className="text-gold font-semibold">{formatCurrency(event.ticketPrice)}</span>
            {isStreamer && event.streamKey && (
              <span className="text-xs text-gray-400">Key: {event.streamKey.slice(0, 8)}...</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StreamerDashboard;
