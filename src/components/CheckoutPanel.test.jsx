import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CheckoutPanel from './CheckoutPanel';
import * as checkout from '../services/checkoutService';

vi.mock('../services/checkoutService');
const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

const event = { ticketPrice: 10, currency: 'USD' };
const order = { orderId: 'o1', total: 10, currency: 'USD', paymentProvider: 'mock' };
const renderPanel = (props = {}) =>
  render(
    <MemoryRouter>
      <CheckoutPanel event={event} eventId="e1" user={{ uid: 'u1' }} onPurchased={vi.fn()} {...props} />
    </MemoryRouter>
  );

describe('CheckoutPanel', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sends anonymous users to login instead of creating an order', async () => {
    renderPanel({ user: null });
    await userEvent.click(screen.getByRole('button', { name: /buy tickets/i }));
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(checkout.createOrder).not.toHaveBeenCalled();
  });

  it('grants access only after the backend confirms paid + tickets issued', async () => {
    checkout.createOrder.mockResolvedValue(order);
    checkout.startPayment.mockResolvedValue({ providerPaymentId: 'pp1' });
    checkout.verifyPayment.mockResolvedValue({ success: true, status: 'paid', ticketsIssued: true });
    const onPurchased = vi.fn();
    renderPanel({ onPurchased });
    await userEvent.click(screen.getByRole('button', { name: /buy tickets/i }));
    await waitFor(() => expect(onPurchased).toHaveBeenCalledTimes(1));
  });

  it('does NOT grant access when payment is still pending', async () => {
    checkout.createOrder.mockResolvedValue(order);
    checkout.startPayment.mockResolvedValue({ providerPaymentId: 'pp1' });
    checkout.verifyPayment.mockResolvedValue({ success: true, status: 'pending' });
    const onPurchased = vi.fn();
    renderPanel({ onPurchased });
    await userEvent.click(screen.getByRole('button', { name: /buy tickets/i }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(expect.stringContaining('/checkout/status')));
    expect(onPurchased).not.toHaveBeenCalled();
  });

  it('shows an error and allows retry when order creation fails', async () => {
    checkout.createOrder.mockRejectedValue(new Error('Event is not available'));
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: /buy tickets/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Event is not available');
    expect(screen.getByRole('button', { name: /try again/i })).toBeEnabled();
  });

  it('limits quantity to 1..10', async () => {
    renderPanel();
    const dec = screen.getByRole('button', { name: /decrease quantity/i });
    expect(dec).toBeDisabled();
    const inc = screen.getByRole('button', { name: /increase quantity/i });
    for (let i = 0; i < 12; i += 1) if (!inc.disabled) await userEvent.click(inc);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(inc).toBeDisabled();
  });
});
