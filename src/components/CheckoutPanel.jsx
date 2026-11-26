import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, startPayment, verifyPayment } from '../services/checkoutService';
import { resolveCheckoutState } from '../utils/checkoutState';
import { formatCurrency } from '../utils/formatDate';

const MAX_QTY = 10;

/**
 * Ticket purchase for a paid event. Flow: create order -> start payment -> (provider page | immediate verify).
 * Access is only granted once the backend reports the payment verified AND tickets issued.
 */
const CheckoutPanel = ({ event, eventId, user, onPurchased }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [phase, setPhase] = useState('idle'); // idle | working | pending | failed
  const [error, setError] = useState('');

  const unit = Number(event.ticketPrice) || 0;

  const buy = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setPhase('working');
    setError('');
    try {
      const order = await createOrder(event, eventId, quantity);
      const payment = await startPayment(order);

      if (order.paymentProvider === 'mock') {
        // Local development only: no external page, verify straight away.
        const result = await verifyPayment(payment.providerPaymentId, 'mock');
        const state = resolveCheckoutState(result);
        if (state === 'success') {
          onPurchased?.();
          setPhase('idle');
        } else {
          navigate(`/checkout/status?pp=${encodeURIComponent(payment.providerPaymentId)}&provider=mock&event=${eventId}`);
        }
        return;
      }

      if (payment.paymentUrl) {
        const returnTo = `${window.location.origin}/checkout/status`;
        sessionStorage.setItem('chandara:checkout', JSON.stringify({ pp: payment.providerPaymentId, provider: order.paymentProvider, event: eventId, returnTo }));
        window.location.assign(payment.paymentUrl);
        return;
      }
      setPhase('pending');
    } catch (e) {
      setError(e.message || 'Could not start checkout.');
      setPhase('failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label htmlFor="qty" className="text-gray-300">Tickets</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="w-8 h-8 rounded bg-gray-800 text-white disabled:opacity-40"
            disabled={quantity <= 1 || phase === 'working'}
            onClick={() => setQuantity((q) => q - 1)}
          >-</button>
          <span id="qty" aria-live="polite" className="w-6 text-center text-white">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="w-8 h-8 rounded bg-gray-800 text-white disabled:opacity-40"
            disabled={quantity >= MAX_QTY || phase === 'working'}
            onClick={() => setQuantity((q) => q + 1)}
          >+</button>
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        Subtotal {formatCurrency(unit * quantity)} (taxes and fees are added at payment)
      </p>

      {phase === 'failed' && (
        <p role="alert" className="text-red-400 text-sm mb-3">{error}</p>
      )}
      {phase === 'pending' && (
        <p role="status" className="text-yellow-400 text-sm mb-3">Payment is pending. Check your orders for the latest status.</p>
      )}

      <button
        type="button"
        onClick={buy}
        disabled={phase === 'working'}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {phase === 'working' ? 'Processing...' : phase === 'failed' ? 'Try again' : 'Buy tickets'}
      </button>
    </div>
  );
};

export default CheckoutPanel;
