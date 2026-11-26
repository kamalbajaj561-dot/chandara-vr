/**
 * Maps a backend payment verification result to what the UI should show.
 *  - success : paid AND tickets issued  -> access granted
 *  - paid    : paid but tickets not issued yet -> keep polling (issuance can lag / be retried)
 *  - pending : provider has not confirmed the payment yet
 *  - failed  : provider reported failure/cancellation
 */
export function resolveCheckoutState(result) {
  if (!result) return 'pending';
  const status = result.status;
  if (result.success && status === 'paid') return result.ticketsIssued ? 'success' : 'paid';
  if (status === 'failed' || status === 'cancelled') return 'failed';
  if (status === 'refunded') return 'failed';
  return 'pending';
}

export const isTerminalCheckoutState = (state) => state === 'success' || state === 'failed';

export const ORDER_STATUS_LABEL = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  failed: 'Payment failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function canCancelOrder(order) {
  return order?.status === 'pending';
}

export function canRequestRefund(order, existingRefunds = []) {
  return order?.status === 'paid' && !existingRefunds.some((r) => r.status === 'pending' || r.status === 'approved');
}

/** Dev-only provider; production builds always use the configured real provider. */
export function getPaymentProvider() {
  const configured = import.meta.env.VITE_PAYMENT_PROVIDER;
  if (configured === 'mock' && !import.meta.env.DEV) return 'razorpay';
  return configured || (import.meta.env.DEV ? 'mock' : 'razorpay');
}
