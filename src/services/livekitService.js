// LiveKit service for token generation and room management
import { auth } from '../firebase/firebase';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const generateLiveKitToken = async (roomName, participantName, role) => {
  try {
    // Check if user is authenticated with Firebase
    if (!auth.currentUser) {
      return { success: false, error: 'Please sign in to publish' };
    }

    // Get Firebase ID token for backend authentication
    const token = await auth.currentUser.getIdToken();
    
    if (!token) {
      return { success: false, error: 'Authentication failed' };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/livekit/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        roomName,
        participantName,
        role,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      return { success: true, token: data.data.token, url: data.data.url };
    } else {
      return { success: false, error: data.error || 'Failed to generate token' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getLiveKitURL = () => {
  // Use the URL from backend token response if available, otherwise use env var
  return import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';
};
