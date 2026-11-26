import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent, TrackType, DisconnectReason } from 'livekit-client';
import { generateLiveKitToken, getLiveKitURL } from '../services/livekitService';
import { Video, Users, Volume2, AlertCircle, Maximize, Minimize } from 'lucide-react';

// Component for a single remote participant's video
const RemoteParticipantVideo = ({ participant, videoTrack, audioTrack, room }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioError, setAudioError] = useState(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Fullscreen failed:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  };

  const handleDoubleClick = () => {
    toggleFullscreen();
  };

  const enableAudio = async () => {
    try {
      if (room) await room.startAudio();
      const el = audioRef.current;
      if (!el) {
        setAudioError('Audio element not found');
        return;
      }
      el.muted = false;
      await el.play();
      setAudioEnabled(true);
      setAudioError(null);
    } catch (err) {
      if (err.name === 'AbortError') return; // superseded by a track change; not an error
      setAudioError(err.name === 'NotAllowedError'
        ? 'Browser blocked audio - click Enable Audio again'
        : `${err.name}: ${err.message}`);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Attach video track when element mounts
  useEffect(() => {
    if (videoTrack && videoRef.current) {
      console.log('>>> React: Attaching video track to ref');
      console.log('>>> React: videoRef.current:', videoRef.current);
      videoTrack.attach(videoRef.current);
      console.log('>>> React: Video track attached, attachedElements:', videoTrack.attachedElements?.length);
      
      return () => {
        console.log('>>> React: Detaching video track');
        videoTrack.detach();
      };
    } else if (videoTrack && !videoRef.current) {
      console.error('>>> React ERROR: videoTrack exists but videoRef.current is null');
    }
  }, [videoTrack]);

  // Attach remote audio. Depends ONLY on audioTrack: putting state such as
  // "audioAttached" in the deps made React run the cleanup right after attaching
  // (detach + pause), which caused "AbortError: play() request was interrupted".
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioTrack || !audioEl) return undefined;

    audioTrack.attach(audioEl);
    audioEl.muted = false;
    audioEl.volume = 1.0;
    setAudioError(null);

    // Try to start playback; browsers may block this until a user gesture.
    audioEl.play().then(() => setAudioEnabled(true)).catch((err) => {
      if (err.name !== 'AbortError') setAudioEnabled(false);
    });

    return () => {
      audioTrack.detach(audioEl);
      audioEl.srcObject = null;
      setAudioEnabled(false);
    };
  }, [audioTrack]);

  // Reflect LiveKit's autoplay-blocked state
  useEffect(() => {
    if (!room) return undefined;
    const onStatus = () => {
      if (room.canPlaybackAudio) setAudioError(null);
    };
    room.on(RoomEvent.AudioPlaybackStatusChanged, onStatus);
    return () => room.off(RoomEvent.AudioPlaybackStatusChanged, onStatus);
  }, [room]);

  return (
    <div className="card">
      <div 
        ref={containerRef}
        className={`bg-black rounded-lg overflow-hidden aspect-video mb-3 relative ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          onDoubleClick={handleDoubleClick}
          style={isFullscreen ? { objectFit: 'contain' } : {}}
        />
        {!videoTrack && (
          <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none">
            <div className="text-center">
              <Video className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No video</p>
            </div>
          </div>
        )}
        {videoTrack && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        )}
      </div>
      <audio ref={audioRef} playsInline />
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">{participant.name}</h3>
          <p className="text-gray-400 text-sm">{participant.identity}</p>
        </div>
        <div className="flex gap-2 items-center">
          {videoTrack && (
            <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs">Video</span>
          )}
          {audioTrack && (
            <>
              {audioEnabled ? (
                <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">Audio Enabled</span>
              ) : (
                <button
                  onClick={enableAudio}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                >
                  Enable Audio
                </button>
              )}
            </>
          )}
          {audioError && (
            <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs truncate max-w-[200px]" title={audioError}>
              {audioError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const Viewer = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [participantTracks, setParticipantTracks] = useState({}); // Store actual track objects
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Disconnected');

  const roomName = eventId || `test-room-${Date.now()}`;
  const participantNameRef = useRef(`viewer-${Date.now()}`);
  const participantName = participantNameRef.current;
  const roomRef = useRef(null);
  const mountedRef = useRef(true);
  const retryRef = useRef({ count: 0, timer: null });

  // Unmount: disconnect the room we actually hold (roomRef), not the stale first-render state value.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(retryRef.current.timer);
      const r = roomRef.current;
      roomRef.current = null;
      r?.removeAllListeners();
      r?.disconnect();
    };
  }, []);

  // Retry a lost connection a few times with backoff, fetching a fresh token each time.
  const scheduleReconnect = () => {
    const state = retryRef.current;
    if (state.count >= 3) {
      setStatus('Connection lost');
      setError('Connection lost. Check your network and press Join to retry.');
      return;
    }
    state.count += 1;
    setStatus(`Reconnecting (attempt ${state.count}/3)...`);
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      if (mountedRef.current) connectToRoom();
    }, 1000 * 2 ** state.count);
  };

  const connectToRoom = async () => {
    const previous = roomRef.current;
    if (previous) {
      roomRef.current = null;
      previous.removeAllListeners();
      await previous.disconnect();
    }
    try {
      setStatus('Connecting...');
      setError(null);

      const tokenResult = await generateLiveKitToken(roomName, participantName, 'subscriber');
      
      if (!tokenResult.success) {
        throw new Error(tokenResult.error);
      }

      const liveKitURL = tokenResult.url || getLiveKitURL();
      
      // Create room with autoSubscribe enabled
      const newRoom = new Room({
        autoSubscribe: true,
      });
      
      // Register event listeners BEFORE connecting
      newRoom.on(RoomEvent.Connected, () => {
        retryRef.current.count = 0;
        setIsConnected(true);
        setError(null);
        setStatus('Connected');
        updateParticipantCount(newRoom);
        updateRemoteParticipants(newRoom);
      });

      newRoom.on(RoomEvent.Reconnecting, () => {
        setStatus('Reconnecting...');
      });

      newRoom.on(RoomEvent.Reconnected, () => {
        setStatus('Connected');
        updateParticipantCount(newRoom);
        updateRemoteParticipants(newRoom);
      });

      newRoom.on(RoomEvent.Disconnected, (reason) => {
        if (!mountedRef.current || roomRef.current !== newRoom) return; // intentional leave / superseded
        setIsConnected(false);
        setParticipantTracks({});
        setRemoteParticipants([]);
        if (reason === DisconnectReason.ROOM_DELETED) {
          setStatus('Stream ended');
          setError(null);
        } else if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
          setStatus('Removed');
          setError('You were removed from this stream.');
        } else if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
          setStatus('Disconnected');
          setError('You joined this stream from another tab or device.');
        } else if (reason !== DisconnectReason.CLIENT_INITIATED) {
          scheduleReconnect();
        } else {
          setStatus('Disconnected');
        }
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        updateParticipantCount(newRoom);
        updateRemoteParticipants(newRoom);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setParticipantTracks((prev) => {
          const next = { ...prev };
          delete next[participant.identity];
          return next;
        });
        updateParticipantCount(newRoom);
        updateRemoteParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('=== Track Subscribed ===');
        console.log('Track kind:', track.kind);
        console.log('From participant:', participant.identity, 'name:', participant.name);
        console.log('Publication trackSid:', publication.trackSid);
        
        // Store track object in state for React to handle attachment
        setParticipantTracks(prev => ({
          ...prev,
          [participant.identity]: {
            ...prev[participant.identity],
            [track.kind]: track
          }
        }));
        
        console.log('Track stored in state for:', participant.identity, track.kind);
      });

      newRoom.on(RoomEvent.TrackSubscriptionFailed, (track, publication, participant, error) => {
        console.error('=== Track Subscription Failed ===');
        console.error('Track kind:', track?.kind);
        console.error('From participant:', participant?.identity, 'name:', participant?.name);
        console.error('Publication trackSid:', publication?.trackSid);
        console.error('Error:', error);
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
        
        // Remove track from state
        setParticipantTracks(prev => ({
          ...prev,
          [participant.identity]: {
            ...prev[participant.identity],
            [track.kind]: null
          }
        }));
      });

      newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('Viewer connection state changed:', state);
        if (state === 'disconnected') {
          setIsConnected(false);
          setStatus('Disconnected');
        }
      });

      roomRef.current = newRoom;
      await newRoom.connect(liveKitURL, tokenResult.token);
      if (!mountedRef.current) {
        newRoom.removeAllListeners();
        newRoom.disconnect();
        return;
      }
      setRoom(newRoom);
    } catch (err) {
      console.error('Connection error:', err.message);
      if (!mountedRef.current) return;
      const failed = roomRef.current;
      roomRef.current = null;
      failed?.removeAllListeners();
      setError(err.message);
      setStatus('Connection Failed');
    }
  };

  const updateParticipantCount = (currentRoom) => {
    // LiveKit client v2 API: use remoteParticipants Map
    const remoteCount = currentRoom.remoteParticipants?.size || 0;
    const count = remoteCount + 1; // +1 for local participant
    setParticipantCount(count);
  };

  const updateRemoteParticipants = (currentRoom) => {
    // LiveKit client v2 API: use remoteParticipants Map
    const participants = Array.from(currentRoom.remoteParticipants.values()).map(p => ({
      identity: p.identity,
      name: p.name || p.identity,
      hasVideo: p.trackPublications.size > 0 && Array.from(p.trackPublications.values()).some(pub => pub.kind === TrackType.VIDEO),
      hasAudio: p.trackPublications.size > 0 && Array.from(p.trackPublications.values()).some(pub => pub.kind === TrackType.AUDIO),
    }));
    setRemoteParticipants(participants);
  };

  const disconnect = async () => {
    await cleanup();
    navigate('/event/' + eventId);
  };

  const cleanup = async () => {
    clearTimeout(retryRef.current.timer);
    const r = roomRef.current;
    roomRef.current = null;
    if (r) {
      r.removeAllListeners();
      await r.disconnect();
    }
    setRoom(null);
    setIsConnected(false);
    setRemoteParticipants([]);
    setParticipantTracks({});
    setStatus('Disconnected');
  };

  return (
    <div className="min-h-screen bg-darkerBlue">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Viewer</h1>
          <button
            onClick={disconnect}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            Leave Room
          </button>
        </div>

        {/* Status Card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Room: {roomName}</h2>
              <p className="text-gray-400 text-sm">Participant: {participantName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span>{participantCount} participants</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isConnected ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                {status}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-4 mb-6">
            {!isConnected ? (
              <button
                onClick={connectToRoom}
                disabled={status === 'Connecting...'}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <Video className="w-5 h-5" />
                Join Room
              </button>
            ) : (
              <div className="flex-1 py-3 bg-green-600/20 text-green-400 border border-green-600 rounded-lg flex items-center justify-center gap-2">
                <Volume2 className="w-5 h-5" />
                {Object.keys(participantTracks).length > 0 ? 'Live' : 'Connected - Waiting for streams'}
              </div>
            )}
          </div>

          {/* Video Grid */}
          {isConnected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {remoteParticipants.length === 0 ? (
                <div className="col-span-2 bg-black rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Waiting for publisher to start streaming...</p>
                  </div>
                </div>
              ) : (
                remoteParticipants.map((participant) => (
                  <RemoteParticipantVideo
                    key={participant.identity}
                    participant={participant}
                    videoTrack={participantTracks[participant.identity]?.video || null}
                    audioTrack={participantTracks[participant.identity]?.audio || null}
                    room={room}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
          <ol className="text-gray-400 space-y-2 list-decimal list-inside">
            <li>Click "Join Room" to connect as a viewer</li>
            <li>Wait for the publisher to start streaming</li>
            <li>Video and audio will appear automatically when available</li>
            <li>Multiple publishers can be displayed in a grid layout</li>
            <li>Click "Leave Room" to disconnect</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Viewer;
