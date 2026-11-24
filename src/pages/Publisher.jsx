import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent, TrackType, createLocalVideoTrack, createLocalAudioTrack, LocalAudioTrack } from 'livekit-client';
import { generateLiveKitToken, getLiveKitURL } from '../services/livekitService';
import { Camera, Mic, MicOff, CameraOff, Video, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Publisher = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Disconnected');
  
  const videoElementRef = useRef(null);
  const localTracksRef = useRef({ video: null, audio: null });
  const [cameras, setCameras] = useState([]);
  const [microphones, setMicrophones] = useState([]);
  const [cameraId, setCameraId] = useState('');
  const [micId, setMicId] = useState('');

  const roomName = eventId || `test-room-${Date.now()}`;
  const participantName = `publisher-${Date.now()}`;

  useEffect(() => {
    console.log('Publisher component mounted');
    return () => {
      console.log('Publisher component unmounting');
      cleanup();
    };
  }, []);

  const connectToRoom = async () => {
    try {
      setStatus('Connecting...');
      setError(null);

      const tokenResult = await generateLiveKitToken(roomName, participantName, 'publisher');
      
      if (!tokenResult.success) {
        throw new Error(tokenResult.error);
      }

      const liveKitURL = tokenResult.url || getLiveKitURL();
      console.log('=== Publisher Connection ===');
      console.log('Room name (from state):', roomName);
      console.log('Participant name (from state):', participantName);
      console.log('LiveKit URL:', liveKitURL);
      
      const newRoom = new Room();
      
      newRoom.on(RoomEvent.Connected, () => {
        console.log('=== Publisher Connected ===');
        console.log('Room name (from room):', newRoom.name);
        console.log('Local participant identity:', newRoom.localParticipant.identity);
        console.log('Local participant name:', newRoom.localParticipant.name);
        console.log('Remote participants:', newRoom.remoteParticipants.size);
        newRoom.remoteParticipants.forEach((p, identity) => {
          console.log('  Remote participant:', identity, 'name:', p.name);
        });
        setIsConnected(true);
        setStatus('Connected');
        updateParticipantCount(newRoom);
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('Publisher disconnected from room');
        setIsConnected(false);
        setIsPublishing(false);
        setStatus('Disconnected');
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected to publisher room:', participant.identity, 'name:', participant.name);
        updateParticipantCount(newRoom);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected from publisher room:', participant.identity);
        updateParticipantCount(newRoom);
      });

      newRoom.on(RoomEvent.TrackPublished, (publication, participant) => {
        console.log('Track published:', publication.kind, 'trackSid:', publication.trackSid, 'by:', participant?.identity);
        if (publication.kind === TrackType.VIDEO) {
          setCameraEnabled(true);
        } else if (publication.kind === TrackType.AUDIO) {
          setMicrophoneEnabled(true);
        }
      });

      newRoom.on(RoomEvent.TrackUnpublished, (publication) => {
        console.log('Track unpublished:', publication.kind, 'trackSid:', publication.trackSid);
        if (publication.kind === TrackType.VIDEO) {
          setCameraEnabled(false);
        } else if (publication.kind === TrackType.AUDIO) {
          setMicrophoneEnabled(false);
        }
      });

      newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('Publisher connection state changed:', state);
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

  const describeMediaError = (err) => {
    switch (err?.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Camera/microphone permission was denied. Allow access in your browser settings and try again.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No camera or microphone was found. Connect a device and try again.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Your camera or microphone is in use by another application.';
      case 'OverconstrainedError':
        return 'The selected device is unavailable. Choose another device.';
      default:
        return err?.message || 'Could not access camera or microphone.';
    }
  };

  const refreshDevices = async () => {
    try {
      const [cams, mics] = await Promise.all([
        Room.getLocalDevices('videoinput'),
        Room.getLocalDevices('audioinput'),
      ]);
      setCameras(cams);
      setMicrophones(mics);
      setCameraId((cur) => cur || cams[0]?.deviceId || '');
      setMicId((cur) => cur || mics[0]?.deviceId || '');
    } catch (e) {
      console.warn('Could not list media devices:', e);
    }
  };

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices);
  }, []);

  // Release camera/mic if the tab is closed or reloaded mid-broadcast.
  useEffect(() => {
    const onUnload = () => {
      const { video, audio } = localTracksRef.current;
      video?.stop();
      audio?.stop();
      room?.disconnect();
    };
    window.addEventListener('pagehide', onUnload);
    return () => window.removeEventListener('pagehide', onUnload);
  }, [room]);

  const toggleMicrophone = async () => {
    const track = localTracksRef.current.audio;
    if (!track) return;
    if (microphoneEnabled) await track.mute(); else await track.unmute();
    setMicrophoneEnabled(!microphoneEnabled);
  };

  const toggleCamera = async () => {
    const track = localTracksRef.current.video;
    if (!track) return;
    if (cameraEnabled) await track.mute(); else await track.unmute();
    setCameraEnabled(!cameraEnabled);
  };

  const startCameraAndMicrophone = async () => {
    if (!room) return;

    try {
      setStatus('Requesting permissions...');
      
      // LiveKit client v2 API: create local tracks with audio processing
      const videoTrack = await createLocalVideoTrack(cameraId ? { deviceId: { exact: cameraId } } : undefined);
      const audioTrack = await createLocalAudioTrack({
        deviceId: micId ? { exact: micId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      // Log audio settings if mediaStreamTrack is available
      if (audioTrack.mediaStreamTrack) {
        console.log('Audio track settings:', audioTrack.mediaStreamTrack.getSettings());
      }
      
      setStatus('Publishing tracks...');
      
      // Publish tracks to room
      localTracksRef.current = { video: videoTrack, audio: audioTrack };
      const videoPublication = await room.localParticipant.publishTrack(videoTrack);
      const audioPublication = await room.localParticipant.publishTrack(audioTrack);
      
      console.log('=== Publisher Track Publications ===');
      console.log('Video track published:', videoPublication.trackSid, 'kind:', videoPublication.kind);
      console.log('Audio track published:', audioPublication.trackSid, 'kind:', audioPublication.kind);
      console.log('Local participant track publications:', room.localParticipant.trackPublications.size);
      room.localParticipant.trackPublications.forEach((pub, sid) => {
        console.log('Publication:', sid, 'kind:', pub.kind, 'trackSid:', pub.trackSid);
      });
      
      setIsPublishing(true);
      setCameraEnabled(true);
      setMicrophoneEnabled(true);
      setStatus('Publishing');
      refreshDevices();

      // Attach local video track to preview element
      if (videoElementRef.current) {
        videoTrack.attach(videoElementRef.current);
      }
      
      // IMPORTANT: never attach the local microphone track to an <audio> element.
      // Playing your own mic through the speakers causes acoustic feedback (echo).
    } catch (err) {
      console.error('Media capture error:', err);
      await releaseLocalTracks();
      setError(describeMediaError(err));
      setStatus('Media Capture Failed');
    }
  };

  // Unpublish and fully stop local tracks so the camera/mic hardware is released.
  const releaseLocalTracks = async () => {
    const { video, audio } = localTracksRef.current;
    localTracksRef.current = { video: null, audio: null };
    for (const t of [video, audio]) {
      if (!t) continue;
      try { await room?.localParticipant.unpublishTrack(t, true); } catch (e) { /* already gone */ }
      try { t.detach(); t.stop(); } catch (e) { /* already stopped */ }
    }
  };

  const stopPublishing = async () => {
    if (!room) return;

    try {
      await releaseLocalTracks();

      setIsPublishing(false);
      setCameraEnabled(false);
      setMicrophoneEnabled(false);
      setStatus('Connected');
    } catch (err) {
      console.error('Stop publishing error:', err);
      setError(err.message);
    }
  };

  const disconnect = async () => {
    await cleanup();
    navigate('/event/' + eventId);
  };

  const cleanup = async () => {
    if (room) {
      await releaseLocalTracks();
      await room.disconnect();
      setRoom(null);
    }
    setIsConnected(false);
    setIsPublishing(false);
    setCameraEnabled(false);
    setMicrophoneEnabled(false);
    setStatus('Disconnected');
  };

  const updateParticipantCount = (currentRoom) => {
    // LiveKit client v2 API: use remoteParticipants Map
    const remoteCount = currentRoom.remoteParticipants?.size || 0;
    const count = remoteCount + 1; // +1 for local participant
    setParticipantCount(count);
  };

  const handleButtonClick = (e) => {
    connectToRoom();
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-darkerBlue flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">Please sign in to publish video</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary px-6 py-3 rounded-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkerBlue">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Publisher Studio</h1>
          {isConnected && (
            <button
              onClick={disconnect}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Disconnect
            </button>
          )}
        </div>

        {/* Status Card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Room: {roomName}</h2>
              <p className="text-gray-400 text-sm">Participant: {room?.localParticipant?.identity || participantName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span>{participantCount} viewers</span>
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

          {/* Video Preview */}
          <div className="bg-black rounded-lg overflow-hidden aspect-video mb-4 flex items-center justify-center relative">
            <video
              ref={videoElementRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isPublishing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Video className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* Device selection */}
          {isConnected && !isPublishing && (
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <label className="text-sm text-gray-300">
                Camera
                <select
                  value={cameraId}
                  onChange={(e) => setCameraId(e.target.value)}
                  className="mt-1 w-full bg-gray-800 text-white rounded-lg px-3 py-2"
                >
                  {cameras.length === 0 && <option value="">No camera found</option>}
                  {cameras.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-gray-300">
                Microphone
                <select
                  value={micId}
                  onChange={(e) => setMicId(e.target.value)}
                  className="mt-1 w-full bg-gray-800 text-white rounded-lg px-3 py-2"
                >
                  {microphones.length === 0 && <option value="">No microphone found</option>}
                  {microphones.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${i + 1}`}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-4 mb-4">
            {!isConnected ? (
              <button
                onClick={handleButtonClick}
                disabled={status === 'Connecting...'}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <Video className="w-5 h-5" />
                Connect to Room
              </button>
            ) : (
              <>
                {!isPublishing ? (
                  <button
                    onClick={startCameraAndMicrophone}
                    disabled={status === 'Requesting permissions...' || status === 'Publishing tracks...'}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera & Microphone
                  </button>
                ) : (
                  <button
                    onClick={stopPublishing}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    <CameraOff className="w-5 h-5" />
                    Stop Publishing
                  </button>
                )}
              </>
            )}
          </div>

          {/* Track Status */}
          <div className="flex gap-4">
            <button type="button" onClick={toggleCamera} disabled={!isPublishing} aria-pressed={cameraEnabled} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              cameraEnabled ? 'bg-green-600/20 text-green-400 border border-green-600' : 'bg-gray-700/30 text-gray-400 border border-gray-600'
            }`}>
              <Camera className="w-4 h-4" />
              <span>Camera {cameraEnabled ? 'On' : 'Off'}</span>
            </button>
            <button type="button" onClick={toggleMicrophone} disabled={!isPublishing} aria-pressed={microphoneEnabled} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              microphoneEnabled ? 'bg-green-600/20 text-green-400 border border-green-600' : 'bg-gray-700/30 text-gray-400 border border-gray-600'
            }`}>
              <Mic className="w-4 h-4" />
              <span>Microphone {microphoneEnabled ? 'On' : 'Off'}</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
          <ol className="text-gray-400 space-y-2 list-decimal list-inside">
            <li>Click "Connect to Room" to establish a connection with LiveKit</li>
            <li>Grant camera and microphone permissions when prompted</li>
            <li>Click "Start Camera & Microphone" to begin publishing</li>
            <li>Share the room name with viewers to allow them to join</li>
            <li>Click "Stop Publishing" to pause streaming while staying connected</li>
            <li>Click "Disconnect" to leave the room completely</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Publisher;
