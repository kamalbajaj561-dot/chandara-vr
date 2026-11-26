import { getMyTickets } from './checkoutService';

/**
 * Can the signed-in user watch this event? Free events: yes. Paid events: only with a ticket the BACKEND issued
 * after verified payment (active or used). Owners/admins are handled by the caller.
 * Returns true/false, or throws on network/server errors so callers can show a retry instead of "Ticket required".
 */
export async function hasEventAccess(event, eventId, user) {
  if (!(Number(event?.ticketPrice) > 0)) return true;
  if (!user) return false;
  const tickets = await getMyTickets();
  return (tickets || []).some((t) => t.eventId === eventId && (t.status === 'active' || t.status === 'used'));
}
