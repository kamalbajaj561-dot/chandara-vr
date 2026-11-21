import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent, TrackType } from 'livekit-client';
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
  const [audioAttached, setAudioAttached] = useState(false);

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
    console.log('>>> React: enableAudio() called');
    console.log('>>> React: room exists:', !!room);
    console.log('>>> React: room.canPlaybackAudio:', room?.canPlaybackAudio);
    console.log('>>> React: audioRef.current:', audioRef.current);
    
    try {
      if (room) {
        await room.startAudio();
        console.log('>>> React: room.startAudio() succeeded');
        
        // Try to play the audio element directly
        if (audioRef.current) {
          console.log('>>> React: Audio element state before play():');
          console.log('  muted:', audioRef.current.muted);
          console.log('  volume:', audioRef.current.volume);
          console.log('  readyState:', audioRef.current.readyState);
          console.log('  paused:', audioRef.current.paused);
          
          // Ensure element is not already playing
          if (!audioRef.current.paused) {
            console.log('>>> React: Audio already playing');
            setAudioEnabled(true);
            setAudioError(null);
            return;
          }
          
          audioRef.current.play().then(() => {
            console.log('>>> React: Audio element play() succeeded');
            setAudioEnabled(true);
            setAudioError(null);
          }).catch((err) => {
            console.error('>>> React: Audio element play() failed:', err);
            console.error('>>> React: Error name:', err.name);
            console.error('>>> React: Error message:', err.message);
            
            if (err.name === 'AbortError') {
              setAudioError('Play interrupted by cleanup');
            } else if (err.name === 'NotAllowedError') {
              setAudioError('Autoplay blocked - click again');
            } else {
              setAudioError(`${err.name}: ${err.message}`);
            }
          });
        } else {
          console.error('>>> React: audioRef.current is null');
          setAudioError('Audio element not found');
        }
      }
    } catch (err) {
      console.error('>>> React: room.startAudio() failed:', err);
      console.error('>>> React: Error name:', err.name);
      console.error('>>> React: Error message:', err.message);
      setAudioError(`${err.name}: ${err.message}`);
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

  // Attach audio track when element mounts - only once
  useEffect(() => {
    if (audioTrack && audioRef.current && !audioAttached) {
      console.log('>>> React: Attaching audio track to ref (first time)');
      console.log('>>> React: audioRef.current:', audioRef.current);
      console.log('>>> React: Audio track properties:');
      console.log('  track kind:', audioTrack.kind);
      console.log('  track enabled:', audioTrack.enabled);
      console.log('  track muted:', audioTrack.muted);
      console.log('  track readyState:', audioTrack.readyState);
      
      audioTrack.attach(audioRef.current);
      console.log('>>> React: Audio track attached, attachedElements:', audioTrack.attachedElements?.length);
      setAudioAttached(true);
      
      // Configure audio element
      const audioEl = audioRef.current;
      audioEl.muted = false;
      audioEl.volume = 1.0;
      audioEl.autoplay = false; // Don't autoplay, wait for user gesture
      
      console.log('>>> React: Audio element configured:');
      console.log('  muted:', audioEl.muted);
      console.log('  volume:', audioEl.volume);
      console.log('  autoplay:', audioEl.autoplay);
      
      // Check WebRTC stats after a delay
      setTimeout(() => {
        if (room) {
          room.getStats().then((stats) => {
            console.log('>>> React: WebRTC stats for audio:');
            console.log('  Stats:', stats);
          }).catch((err) => {
            console.error('>>> React: Failed to get stats:', err);
          });
        }
      }, 2000);
      
      return () => {
        console.log('>>> React: Cleanup: Detaching audio track');
        audioTrack.detach();
        audioEl.pause();
        audioEl.currentTime = 0;
        setAudioAttached(false);
        setAudioEnabled(false);
      };
    }
  }, [audioTrack, audioAttached]);

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
      <audio ref={audioRef} autoPlay />
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
  const participantName = `viewer-${Date.now()}`;

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const connectToRoom = async () => {
    try {
      setStatus('Connecting...');
      setError(null);

      const tokenResult = await generateLiveKitToken(roomName, participantName, 'subscriber');
      
      if (!tokenResult.success) {
        throw new Error(tokenResult.error);
      }

      const liveKitURL = tokenResult.url || getLiveKitURL();
      console.log('=== Viewer Connection ===');
      console.log('Room name (from state):', roomName);
      console.log('Participant name (from state):', participantName);
      console.log('Connecting to LiveKit at:', liveKitURL);
      
      // Create room with autoSubscribe enabled
      const newRoom = new Room({
        autoSubscribe: true,
      });
      
      // Register event listeners BEFORE connecting
      newRoom.on(RoomEvent.Connected, () => {
        console.log('=== Viewer Connected ===');
        console.log('Room name (from room):', newRoom.name);
        console.log('Local participant identity:', newRoom.localParticipant.identity);
        console.log('Local participant name:', newRoom.localParticipant.name);
        console.log('Remote participants:', newRoom.remoteParticipants.size);
        newRoom.remoteParticipants.forEach((participant, identity) => {
          console.log('Remote participant:', identity, 'name:', participant.name);
          console.log('Track publications:', participant.trackPublications.size);
          participant.trackPublications.forEach((pub, sid) => {
            console.log('  Publication:', sid, 'kind:', pub.kind, 'trackSid:', pub.trackSid, 'subscribed:', pub.isSubscribed, 'track:', !!pub.track);
          });
        });
        setIsConnected(true);
        setStatus('Connected');
        updateParticipantCount(newRoom);
        updateRemoteParticipants(newRoom);
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('Viewer disconnected from room');
        setIsConnected(false);
        setStatus('Disconnected');
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('=== Participant Connected ===');
        console.log('Identity:', participant.identity, 'name:', participant.name);
        console.log('Track publications:', participant.trackPublications.size);
        participant.trackPublications.forEach((pub, sid) => {
          console.log('  Publication:', sid, 'kind:', pub.kind, 'trackSid:', pub.trackSid, 'subscribed:', pub.isSubscribed, 'track:', !!pub.track);
        });
        updateParticipantCount(newRoom);
        updateRemoteParticipants(newRoom);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected:', participant.identity, 'name:', participant.name);
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

      await newRoom.connect(liveKitURL, tokenResult.token);
      setRoom(newRoom);
    } catch (err) {
      console.error('Connection error:', err);
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
    if (room) {
      await room.disconnect();
      setRoom(null);
    }
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
