import { apiRequest } from './apiClient';
import { getPaymentProvider } from '../utils/checkoutState';

/** Creates an order. The server prices it from the event; price/amount sent here are display hints only. */
export const createOrder = (event, eventId, quantity) =>
  apiRequest('/orders', {
    method: 'POST',
    body: {
      eventId,
      items: [{ ticketType: 'general', price: Number(event.ticketPrice), quantity }],
      currency: event.currency || 'USD',
      paymentProvider: getPaymentProvider(),
    },
  });

/** Starts the payment for an order. The server uses the stored order total, not these fields. */
export const startPayment = (order) =>
  apiRequest('/payments', {
    method: 'POST',
    body: {
      orderId: order.orderId,
      amount: order.total,
      currency: order.currency,
      provider: order.paymentProvider,
    },
  });

export const verifyPayment = (providerPaymentId, provider) =>
  apiRequest('/payments/verify', { method: 'POST', body: { providerPaymentId, provider } });

export const getMyOrders = () => apiRequest('/orders/my-orders');
export const cancelOrder = (orderId) => apiRequest(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'PUT' });
export const getMyRefunds = () => apiRequest('/refunds/my-refunds');
export const requestRefund = (order, reason) =>
  apiRequest('/refunds', {
    method: 'POST',
    body: { orderId: order.orderId, amount: order.total, currency: order.currency, reason },
  });
export const getMyTickets = () => apiRequest('/tickets/my-tickets');
