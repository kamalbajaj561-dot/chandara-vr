import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvent } from '../services/eventService';
import { hasPurchasedTicket } from '../services/ticketService';
import { Send, Users, Eye, MessageSquare, Glasses } from 'lucide-react';
import { formatDateTime } from '../utils/formatDate';

const Watch = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadEventData();
    // Simulate viewer count updates
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => Math.max(0, prev + Math.floor(Math.random() * 5) - 2));
    }, 5000);
    setViewerCount(Math.floor(Math.random() * 100) + 50);

    return () => clearInterval(viewerInterval);
  }, [id, user]);

  useEffect(() => {
    // Scroll to bottom of chat when new messages arrive
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const loadEventData = async () => {
    try {
      const eventResult = await getEvent(id);
      if (eventResult.success) {
        setEvent(eventResult.event);

        // Check if user has purchased ticket
        if (user) {
          const purchaseResult = await hasPurchasedTicket(id, user.uid);
          if (purchaseResult.success) {
            setHasPurchased(purchaseResult.hasPurchased);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading event:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const newMessage = {
      id: Date.now(),
      user: user.name,
      message: message,
      timestamp: new Date()
    };

    setChatMessages([...chatMessages, newMessage]);
    setMessage('');
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
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-5 h-5" />
                    <span>{viewerCount} viewers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <div className="card h-[calc(100vh-200px)] flex flex-col">
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gold" />
                <h3 className="font-semibold text-white">Live Chat</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-center text-sm">No messages yet</p>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className="text-sm">
                      <span className="text-gold font-semibold">{msg.user}: </span>
                      <span className="text-gray-300">{msg.message}</span>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-gray-800">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={user ? "Type a message..." : "Sign in to chat"}
                    disabled={!user}
                    className="flex-1 bg-darkerBlue border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!user || !message.trim()}
                    className="bg-gold text-black px-3 py-2 rounded-lg hover:bg-goldLight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
