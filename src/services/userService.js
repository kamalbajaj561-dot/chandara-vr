import { db } from '../firebase/firebase';
import { 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

export const getUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, user: userDoc.data() };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUser = async (userId, updateData) => {
  try {
    await updateDoc(doc(db, 'users', userId), updateData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(usersQuery);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const banUser = async (userId) => {
  return updateUser(userId, { isBanned: true });
};

export const unbanUser = async (userId) => {
  return updateUser(userId, { isBanned: false });
};

export const promoteToAdmin = async (userId) => {
  return updateUser(userId, { role: 'admin' });
};

export const promoteToStreamer = async (userId) => {
  return updateUser(userId, { role: 'streamer' });
};

export const demoteToUser = async (userId) => {
  return updateUser(userId, { role: 'user' });
};
