const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Cloud Function: Process ticket purchase and create transaction
exports.processTicketPurchase = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { eventId, amount } = data;
  const userId = context.auth.uid;

  try {
    // Verify event exists and is approved/live
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();
    if (eventData.status !== 'approved' && eventData.status !== 'live') {
      throw new functions.https.HttpsError('failed-precondition', 'Event is not available for purchase');
    }

    // Check if user already purchased
    const existingTicket = await db.collection('tickets')
      .where('eventId', '==', eventId)
      .where('buyerId', '==', userId)
      .get();

    if (!existingTicket.empty) {
      throw new functions.https.HttpsError('already-exists', 'Ticket already purchased');
    }

    // Create ticket
    const ticketRef = await db.collection('tickets').add({
      eventId,
      buyerId: userId,
      amount,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Calculate revenue split
    const platformCommission = amount * 0.1;
    const streamerAmount = amount * 0.9;

    // Create transaction record
    await db.collection('transactions').add({
      eventId,
      amount,
      platformCommission,
      streamerAmount,
      ticketId: ticketRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, ticketId: ticketRef.id };
  } catch (error) {
    console.error('Error processing ticket purchase:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cloud Function: Get streamer revenue
exports.getStreamerRevenue = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { streamerId } = data;
  const requestingUserId = context.auth.uid;

  // Only streamer or admin can access
  const userDoc = await db.collection('users').doc(requestingUserId).get();
  const userData = userDoc.data();

  if (requestingUserId !== streamerId && userData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Access denied');
  }

  try {
    // Get all events by streamer
    const eventsSnapshot = await db.collection('events')
      .where('ownerId', '==', streamerId)
      .get();

    const eventIds = eventsSnapshot.docs.map(doc => doc.id);

    if (eventIds.length === 0) {
      return { totalRevenue: 0, ticketsSold: 0 };
    }

    // Get all transactions for these events
    let totalRevenue = 0;
    let ticketsSold = 0;

    for (const eventId of eventIds) {
      const ticketsSnapshot = await db.collection('tickets')
        .where('eventId', '==', eventId)
        .get();

      ticketsSold += ticketsSnapshot.size;
      ticketsSnapshot.forEach(doc => {
        totalRevenue += doc.data().amount;
      });
    }

    return { totalRevenue, ticketsSold };
  } catch (error) {
    console.error('Error getting streamer revenue:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cloud Function: Notify event approval
exports.notifyEventApproval = functions.firestore
  .document('events/{eventId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();

    // Only notify when status changes to approved
    if (previousValue.status !== 'approved' && newValue.status === 'approved') {
      const ownerId = newValue.ownerId;
      
      // Get streamer's email
      const userDoc = await db.collection('users').doc(ownerId).get();
      const userData = userDoc.data();

      if (userData.email) {
        // Send notification email (requires mailgun or similar service)
        console.log(`Event approved notification sent to ${userData.email}`);
        // Implement email sending logic here
      }
    }
  });

// Cloud Function: Scheduled cleanup of old events
exports.cleanupOldEvents = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

  const oldEvents = await db.collection('events')
    .where('status', '==', 'ended')
    .where('createdAt', '<', cutoffDate)
    .get();

  const batch = db.batch();
  oldEvents.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Cleaned up ${oldEvents.size} old events`);
});
