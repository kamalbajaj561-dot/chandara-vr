import { db } from '../firebase/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  getDoc, 
  doc 
} from 'firebase/firestore';

export const getAdminStats = async () => {
  try {
    // Get total users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get total events
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const totalEvents = eventsSnapshot.size;

    // Get total revenue
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    let totalRevenue = 0;
    let platformCommission = 0;

    transactionsSnapshot.forEach(doc => {
      totalRevenue += doc.data().amount;
      platformCommission += doc.data().platformCommission;
    });

    // Get pending events
    const pendingEventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'pending')
    );
    const pendingEventsSnapshot = await getDocs(pendingEventsQuery);
    const pendingEvents = pendingEventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        totalRevenue,
        platformCommission,
        pendingEventsCount: pendingEvents.length
      },
      pendingEvents
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPendingEvents = async () => {
  try {
    const pendingEventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(pendingEventsQuery);
    const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { success: true, events };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
