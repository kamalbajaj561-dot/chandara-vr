import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvent } from '../services/eventService';
import { hasEventAccess } from '../services/entitlement';
import { Eye, Monitor, X } from 'lucide-react';

const VRViewer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVRMode, setIsVRMode] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [id, user]);

  const loadEventData = async () => {
    try {
      const eventResult = await getEvent(id);
      if (eventResult.success) {
        setEvent(eventResult.event);

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

  const handleExitVR = () => {
    setIsVRMode(false);
  };

  const handleStandardView = () => {
    navigate(`/watch/${id}`);
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

  const is360 = event.cameraType === '360vr';

  return (
    <div className="min-h-screen bg-black">
      {!isVRMode ? (
        // VR Entry Screen
        <div className="min-h-screen bg-gradient-to-br from-darkBlue via-darkerBlue to-black flex items-center justify-center px-4">
          <div className="card max-w-2xl w-full text-center">
            <h1 className="text-4xl font-bold text-white mb-4">VR Viewer</h1>
            <p className="text-gray-300 text-lg mb-8">
              Experience {event.title} in immersive {is360 ? '360°' : '180°'} virtual reality
            </p>

            <div className="bg-darkerBlue rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Camera Type</p>
                  <p className="text-white font-semibold">{is360 ? '360° VR' : '180° VR'}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Event</p>
                  <p className="text-white font-semibold">{event.sport}</p>
                </div>
              </div>

              <div className="bg-gold/10 border border-gold rounded-lg p-4 mb-6">
                <p className="text-gold text-sm">
                  <strong>Instructions:</strong> For the best experience, use a VR headset. 
                  You can also view on your mobile device with gyroscope support or use your mouse to look around.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setIsVRMode(true)}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Enter VR Mode
              </button>
              <button
                onClick={handleStandardView}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Monitor className="w-5 h-5" />
                Standard View
              </button>
            </div>

            <Link to={`/event/${id}`} className="block mt-6 text-gray-400 hover:text-white transition-colors">
              ← Back to Event Details
            </Link>
          </div>
        </div>
      ) : (
        // VR Scene
        <div className="relative w-full h-screen">
          {/* A-Frame Scene */}
          <a-scene embedded vr-mode-ui="enabled: true">
            <a-assets>
              <img id="streamTexture" crossOrigin="anonymous" />
            </a-assets>

            {/* Sky sphere for 360 video */}
            {is360 ? (
              <a-sky 
                src="#streamTexture" 
                rotation="0 -130 0"
                radius="100"
              />
            ) : (
              // Half sphere for 180 video
              <a-sphere 
                src="#streamTexture"
                radius="100"
                theta-length="180"
                rotation="0 -90 0"
              />
            )}

            {/* Camera */}
            <a-entity position="0 1.6 0">
              <a-camera look-controls wasd-controls="enabled: false"></a-camera>
            </a-entity>

            {/* Lighting */}
            <a-light type="ambient" color="#ffffff" intensity="0.5"></a-light>
            <a-light type="directional" color="#ffffff" intensity="0.5" position="-1 1 1"></a-light>
          </a-scene>

          {/* Exit Button */}
          <button
            onClick={handleExitVR}
            className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-black transition-colors z-50"
          >
            <X className="w-5 h-5" />
            Exit VR
          </button>

          {/* Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white p-4 rounded-lg z-50">
            <h3 className="font-semibold mb-1">{event.title}</h3>
            <p className="text-gray-400 text-sm">
              {is360 ? '360° VR Mode' : '180° VR Mode'} • Use mouse or VR headset to look around
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VRViewer;
