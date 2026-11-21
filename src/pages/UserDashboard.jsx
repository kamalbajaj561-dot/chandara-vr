import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserTickets } from '../services/ticketService';
import { getEvents } from '../services/eventService';
import { signOut } from '../services/authService';
import { Ticket, Calendar, Heart, LogOut, User } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatDate';

const UserDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const ticketsResult = await getUserTickets(user.uid);
      if (ticketsResult.success) {
        setTickets(ticketsResult.tickets);
      }

      // Load favorite events (simulated - in real app, store favorites in Firestore)
      const eventsResult = await getEvents({ status: 'approved', limit: 4 });
      if (eventsResult.success) {
        setFavoriteEvents(eventsResult.events.slice(0, 3));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
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
        <h1 className="text-3xl font-bold text-white mb-8">Welcome back, {user?.name}!</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                <Ticket className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Tickets</p>
                <p className="text-2xl font-bold text-white">{tickets.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Favorite Events</p>
                <p className="text-2xl font-bold text-white">{favoriteEvents.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Country</p>
                <p className="text-2xl font-bold text-white">{user?.country}</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Tickets */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">My Tickets</h2>
          {tickets.length === 0 ? (
            <div className="card text-center py-12">
              <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">You haven't purchased any tickets yet</p>
              <Link to="/events" className="btn-primary inline-block">
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>

        {/* Favorite Events */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Recommended Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {favoriteEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TicketCard = ({ ticket }) => {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    loadEvent();
  }, [ticket]);

  const loadEvent = async () => {
    const { getEvent } = await import('../services/eventService');
    const result = await getEvent(ticket.eventId);
    if (result.success) {
      setEvent(result.event);
    }
  };

  if (!event) return null;

  return (
    <Link to={`/event/${event.id}`} className="block">
      <div className="card">
        {event.thumbnail ? (
          <img src={event.thumbnail} alt={event.title} className="w-full h-40 object-cover rounded-t-lg" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-darkBlue to-darkerBlue rounded-t-lg flex items-center justify-center">
            <Ticket className="w-12 h-12 text-gold" />
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-white mb-2">{event.title}</h3>
          <p className="text-gray-400 text-sm mb-2">{formatDateTime(event.date)}</p>
          <div className="flex justify-between items-center">
            <span className="text-gold font-semibold">{formatCurrency(ticket.amount)}</span>
            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Purchased</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const EventCard = ({ event }) => {
  return (
    <Link to={`/event/${event.id}`} className="block">
      <div className="card overflow-hidden group hover:border-gold transition-all">
        {event.thumbnail ? (
          <img src={event.thumbnail} alt={event.title} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-darkBlue to-darkerBlue flex items-center justify-center">
            <Ticket className="w-12 h-12 text-gold" />
          </div>
        )}
        <div className="p-4">
          <span className="text-xs bg-gold text-black px-2 py-1 rounded font-semibold">
            {event.sport}
          </span>
          <h3 className="font-semibold text-white mt-2 mb-2">{event.title}</h3>
          <p className="text-gray-400 text-sm mb-2">{event.city}, {event.country}</p>
          <p className="text-gold font-semibold">{formatCurrency(event.ticketPrice)}</p>
        </div>
      </div>
    </Link>
  );
};

export default UserDashboard;
