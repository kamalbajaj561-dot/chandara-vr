import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvent } from '../services/eventService';
import { hasEventAccess } from '../services/entitlement';
import ChatPanel from '../components/ChatPanel';
import { Eye, Glasses } from 'lucide-react';
import { formatDateTime } from '../utils/formatDate';

const Watch = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
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

        // Entitlement is decided from backend-issued tickets (owners and admins always have access).
        const privileged = user && (user.role === 'admin' || eventResult.event.ownerId === user.uid);
        try {
          setHasPurchased(privileged || (await hasEventAccess(eventResult.event, id, user)));
        } catch (e) {
          console.warn('Could not verify ticket:', e.message);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading event:', error);
      setLoading(false);
    }
  };

  const handleVRView = () => {
    navigate(`/vr-viewer/${id}`);
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

  if (!hasPurchased) {
    return (
      <div className="min-h-screen bg-darkerBlue flex items-center justify-center px-4">
        <div className="card text-center max-w-md">
          <Eye className="w-16 h-16 text-gold mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Ticket Required</h1>
          <p className="text-gray-400 mb-6">You need to purchase a ticket to watch this event</p>
          <Link to={`/event/${id}`} className="btn-primary inline-block">
            Purchase Ticket
          </Link>
        </div>
      </div>
    );
  }

  const isVRSupported = event.cameraType === '180vr' || event.cameraType === '360vr';

  return (
    <div className="min-h-screen bg-darkerBlue">
      {/* Header */}
      <header className="bg-darkBlue border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gold">Chandara VR</Link>
          <div className="flex items-center gap-4">
            {isVRSupported && (
              <button
                onClick={handleVRView}
                className="btn-secondary flex items-center gap-2"
              >
                <Glasses className="w-5 h-5" />
                VR Mode
              </button>
            )}
            <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="card overflow-hidden">
              {/* Video Placeholder */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                {event.status === 'live' ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                      <span className="text-red-600 font-semibold">LIVE</span>
                    </div>
                    <p className="text-gray-400">Live stream would play here</p>
                    <p className="text-gray-500 text-sm mt-2">Stream URL: {event.streamUrl}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-400">Event is not live yet</p>
                    <p className="text-gray-500 text-sm mt-2">Starts: {formatDateTime(event.date)}</p>
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>
                    <p className="text-gray-400">{event.city}, {event.country}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <ChatPanel
              eventId={id}
              user={user}
              canModerate={Boolean(user) && (user.role === 'admin' || event.ownerId === user.uid)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
