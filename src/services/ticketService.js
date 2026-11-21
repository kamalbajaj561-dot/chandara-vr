import { db } from '../firebase/firebase';
import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

export const purchaseTicket = async (eventId, buyerId, amount) => {
  try {
    const ticketDoc = await addDoc(collection(db, 'tickets'), {
      eventId,
      buyerId,
      amount,
      createdAt: new Date().toISOString()
    });

    // Create transaction record
    const platformCommission = amount * 0.1;
    const streamerAmount = amount * 0.9;

    await addDoc(collection(db, 'transactions'), {
      eventId,
      amount,
      platformCommission,
      streamerAmount,
      ticketId: ticketDoc.id,
      createdAt: new Date().toISOString()
    });

    return { success: true, ticketId: ticketDoc.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserTickets = async (userId) => {
  try {
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('buyerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(ticketsQuery);
    const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { success: true, tickets };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getEventTickets = async (eventId) => {
  try {
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('eventId', '==', eventId)
    );

    const querySnapshot = await getDocs(ticketsQuery);
    const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { success: true, tickets };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const hasPurchasedTicket = async (eventId, userId) => {
  try {
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('eventId', '==', eventId),
      where('buyerId', '==', userId)
    );

    const querySnapshot = await getDocs(ticketsQuery);
    return { success: true, hasPurchased: !querySnapshot.empty };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getStreamerRevenue = async (streamerId) => {
  try {
    // Get all events by streamer
    const eventsQuery = query(
      collection(db, 'events'),
      where('ownerId', '==', streamerId)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    const eventIds = eventsSnapshot.docs.map(doc => doc.id);

    if (eventIds.length === 0) {
      return { success: true, totalRevenue: 0, ticketsSold: 0 };
    }

    // Get all tickets for these events
    let totalRevenue = 0;
    let ticketsSold = 0;

    for (const eventId of eventIds) {
      const ticketsResult = await getEventTickets(eventId);
      if (ticketsResult.success) {
        ticketsSold += ticketsResult.tickets.length;
        totalRevenue += ticketsResult.tickets.reduce((sum, ticket) => sum + ticket.amount, 0);
      }
    }

    return { success: true, totalRevenue, ticketsSold };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
