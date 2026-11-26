import { describe, it, expect } from 'vitest';
import { resolveCheckoutState, isTerminalCheckoutState, canCancelOrder, canRequestRefund } from './checkoutState';

describe('resolveCheckoutState', () => {
  it('grants access only when paid AND tickets issued', () => {
    expect(resolveCheckoutState({ success: true, status: 'paid', ticketsIssued: true })).toBe('success');
  });
  it('keeps waiting when paid but tickets not issued yet', () => {
    expect(resolveCheckoutState({ success: true, status: 'paid', ticketsIssued: false })).toBe('paid');
  });
  it('never reports success for pending or unknown results', () => {
    expect(resolveCheckoutState({ success: true, status: 'pending' })).toBe('pending');
    expect(resolveCheckoutState(null)).toBe('pending');
    expect(resolveCheckoutState({ success: false, status: 'paid', ticketsIssued: true })).toBe('pending');
  });
  it('maps failure states', () => {
    for (const status of ['failed', 'cancelled', 'refunded']) {
      expect(resolveCheckoutState({ status })).toBe('failed');
    }
  });
  it('treats only success/failed as terminal', () => {
    expect(isTerminalCheckoutState('success')).toBe(true);
    expect(isTerminalCheckoutState('failed')).toBe(true);
    expect(isTerminalCheckoutState('paid')).toBe(false);
    expect(isTerminalCheckoutState('pending')).toBe(false);
  });
});

describe('order actions', () => {
  it('only pending orders can be cancelled', () => {
    expect(canCancelOrder({ status: 'pending' })).toBe(true);
    expect(canCancelOrder({ status: 'paid' })).toBe(false);
  });
  it('refunds only for paid orders without an open refund', () => {
    expect(canRequestRefund({ status: 'paid' }, [])).toBe(true);
    expect(canRequestRefund({ status: 'paid' }, [{ status: 'pending' }])).toBe(false);
    expect(canRequestRefund({ status: 'pending' }, [])).toBe(false);
  });
});
