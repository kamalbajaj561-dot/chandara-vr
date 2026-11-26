import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvent } from '../services/eventService';
import { getMyTickets } from '../services/checkoutService';
import CheckoutPanel from '../components/CheckoutPanel';
import { getUser } from '../services/userService';
import { Calendar, MapPin, Camera, DollarSign, Play, User as UserIcon } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatDate';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [streamer, setStreamer] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventData();
  }, [id, user]);

  const loadEventData = async () => {
    try {
      const eventResult = await getEvent(id);
      if (eventResult.success) {
        setEvent(eventResult.event);

        // Load streamer info
        const streamerResult = await getUser(eventResult.event.ownerId);
        if (streamerResult.success) {
          setStreamer(streamerResult.user);
        }

        // Entitlement comes from the backend (tickets are only issued after verified payment).
        await refreshEntitlement(eventResult.event);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading event:', error);
      setLoading(false);
    }
  };

  async function refreshEntitlement(ev = event) {
    if (!ev) return;
    if (!(Number(ev.ticketPrice) > 0)) {
      setHasPurchased(true); // free event
      return;
    }
    if (!user) return;
    try {
      const tickets = await getMyTickets();
      setHasPurchased(
        (tickets || []).some((t) => t.eventId === id && (t.status === 'active' || t.status === 'used'))
      );
    } catch (e) {
      console.warn('Could not check ticket status:', e.message);
    }
  }

  const handleWatch = () => {
    if (event.cameraType === '180vr' || event.cameraType === '360vr') {
      navigate(`/vr-viewer/${id}`);
    } else {
      navigate(`/watch/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkerBlue flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-darkerBlue flex items-center justify-center">
        <div className="text-white">Event not found</div>
      </div>
    );
  }

  const isLive = event.status === 'live';
  const isApproved = event.status === 'approved';

  return (
    <div className="min-h-screen bg-darkerBlue">
      {/* Banner */}
      <div className="relative h-96">
        {event.thumbnail ? (
          <img 
            src={event.thumbnail} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-darkBlue to-darkerBlue flex items-center justify-center">
            <Play className="w-24 h-24 text-gold" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <div className="absolute top-4 left-4">
          <Link to="/" className="text-white hover:text-gold transition-colors">
            ← Back to Home
          </Link>
        </div>

        {isLive && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
            <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
            LIVE
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-gold text-black px-3 py-1 rounded-full text-sm font-semibold">
                  {event.sport}
                </span>
                {isLive && (
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    LIVE NOW
                  </span>
                )}
                {isApproved && !isLive && (
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    UPCOMING
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-bold text-white mb-4">{event.title}</h1>
              
              <p className="text-gray-300 text-lg mb-6">{event.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gold" />
                  <div>
                    <p className="text-gray-400 text-sm">Date & Time</p>
                    <p className="text-white">{formatDateTime(event.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gold" />
                  <div>
                    <p className="text-gray-400 text-sm">Location</p>
                    <p className="text-white">{event.city}, {event.country}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-gold" />
                  <div>
                    <p className="text-gray-400 text-sm">Camera Type</p>
                    <p className="text-white">
                      {event.cameraType === 'mobile' ? 'Mobile Camera' : 
                       event.cameraType === '180vr' ? '180 VR Camera' : '360 VR Camera'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gold" />
                  <div>
                    <p className="text-gray-400 text-sm">Ticket Price</p>
                    <p className="text-white font-semibold">{formatCurrency(event.ticketPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Streamer Info */}
              {streamer && (
                <div className="border-t border-gray-700 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center text-black font-bold text-xl">
                      {streamer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Streamer</p>
                      <p className="text-white font-semibold">{streamer.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h2 className="text-xl font-bold text-white mb-4">Purchase Ticket</h2>
              
              <div className="text-center mb-6">
                <p className="text-gray-400 mb-2">Ticket Price</p>
                <p className="text-4xl font-bold text-gold">{Number(event.ticketPrice) > 0 ? formatCurrency(event.ticketPrice) : 'Free'}</p>
              </div>

              {hasPurchased ? (
                <button
                  onClick={handleWatch}
                  disabled={!isLive}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {isLive ? 'Watch Now' : 'Event Not Live Yet'}
                </button>
              ) : (
                isApproved ? (
                  <CheckoutPanel event={event} eventId={id} user={user} onPurchased={() => refreshEntitlement()} />
                ) : null
              )}

              {!isApproved && (
                <p className="text-yellow-400 text-sm text-center mb-4">
                  This event is pending approval
                </p>
              )}

              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-semibold text-white mb-3">What's Included:</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gold rounded-full"></span>
                    Full access to live stream
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gold rounded-full"></span>
                    {event.cameraType === '360vr' ? '360° VR experience' : 
                     event.cameraType === '180vr' ? '180° VR experience' : 'HD quality stream'}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gold rounded-full"></span>
                    Live chat access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gold rounded-full"></span>
                    Instant replay (if available)
                  </li>
                </ul>
              </div>

              {event.cameraType === '180vr' || event.cameraType === '360vr' ? (
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <div className="bg-gold/10 border border-gold rounded-lg p-4">
                    <p className="text-gold text-sm font-semibold mb-2">VR Ready</p>
                    <p className="text-gray-400 text-sm">
                      This event supports immersive VR viewing. Use a VR headset for the best experience.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
