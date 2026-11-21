import { db } from '../firebase/firebase';
import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/firebase';

export const createEvent = async (eventData, thumbnailFile) => {
  try {
    // Upload thumbnail if provided
    let thumbnailUrl = '';
    if (thumbnailFile) {
      const storageRef = ref(storage, `event-thumbnails/${Date.now()}_${thumbnailFile.name}`);
      await uploadBytes(storageRef, thumbnailFile);
      thumbnailUrl = await getDownloadURL(storageRef);
    }

    // Generate stream key and URL
    const streamKey = generateStreamKey();
    const streamUrl = `rtmp://live.chandara-vr.com/live/${streamKey}`;

    const eventDoc = await addDoc(collection(db, 'events'), {
      ...eventData,
      thumbnail: thumbnailUrl,
      streamKey,
      streamUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    return { success: true, eventId: eventDoc.id, streamKey, streamUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getEvent = async (eventId) => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (eventDoc.exists()) {
      return { success: true, event: { id: eventDoc.id, ...eventDoc.data() } };
    }
    return { success: false, error: 'Event not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getEvents = async (filters = {}) => {
  try {
    let eventsQuery = collection(db, 'events');
    
    if (filters.status) {
      eventsQuery = query(eventsQuery, where('status', '==', filters.status));
    }
    
    if (filters.ownerId) {
      eventsQuery = query(eventsQuery, where('ownerId', '==', filters.ownerId));
    }
    
    if (filters.sport) {
      eventsQuery = query(eventsQuery, where('sport', '==', filters.sport));
    }

    eventsQuery = query(eventsQuery, orderBy('createdAt', 'desc'));

    if (filters.limit) {
      eventsQuery = query(eventsQuery, limit(filters.limit));
    }

    const querySnapshot = await getDocs(eventsQuery);
    const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { success: true, events };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateEvent = async (eventId, updateData) => {
  try {
    await updateDoc(doc(db, 'events', eventId), updateData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, 'events', eventId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const approveEvent = async (eventId) => {
  return updateEvent(eventId, { status: 'approved' });
};

export const rejectEvent = async (eventId) => {
  return updateEvent(eventId, { status: 'rejected' });
};

export const startEvent = async (eventId) => {
  return updateEvent(eventId, { status: 'live' });
};

export const endEvent = async (eventId) => {
  return updateEvent(eventId, { status: 'ended' });
};

const generateStreamKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
