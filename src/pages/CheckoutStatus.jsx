import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../services/checkoutService';
import { resolveCheckoutState, isTerminalCheckoutState } from '../utils/checkoutState';

const POLL_MS = 3000;
const MAX_ATTEMPTS = 20;

const CheckoutStatus = () => {
  const [params] = useSearchParams();
  const saved = (() => {
    try { return JSON.parse(sessionStorage.getItem('chandara:checkout') || 'null'); } catch { return null; }
  })();
  const pp = params.get('pp') || saved?.pp;
  const provider = params.get('provider') || saved?.provider;
  const eventId = params.get('event') || saved?.event;

  const [state, setState] = useState(pp && provider ? 'pending' : 'invalid');
  const [message, setMessage] = useState('');
  const attempts = useRef(0);

  useEffect(() => {
    if (!pp || !provider) return undefined;
    let cancelled = false;
    let timer;

    const check = async () => {
      attempts.current += 1;
      try {
        const result = await verifyPayment(pp, provider);
        if (cancelled) return;
        const next = resolveCheckoutState(result);
        setState(next);
        if (next === 'success') sessionStorage.removeItem('chandara:checkout');
        if (!isTerminalCheckoutState(next) && attempts.current < MAX_ATTEMPTS) {
          timer = setTimeout(check, POLL_MS);
        }
      } catch (e) {
        if (cancelled) return;
        setMessage(e.message);
        if (attempts.current < MAX_ATTEMPTS && e.status !== 404 && e.status !== 401) {
          timer = setTimeout(check, POLL_MS);
        } else {
          setState('failed');
        }
      }
    };
    check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [pp, provider]);

  const gaveUp = !isTerminalCheckoutState(state) && attempts.current >= MAX_ATTEMPTS;

  return (
    <div className="min-h-screen bg-darkerBlue flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        {state === 'invalid' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Nothing to check</h1>
            <p className="text-gray-400 mb-6">We couldn't find a payment to look up.</p>
          </>
        )}
        {(state === 'pending' || state === 'paid') && !gaveUp && (
          <div role="status">
            <h1 className="text-2xl font-bold text-white mb-2">Confirming your payment…</h1>
            <p className="text-gray-400 mb-6">
              {state === 'paid' ? 'Payment received. Issuing your tickets…' : "This can take a few seconds. Please don't close this page."}
            </p>
          </div>
        )}
        {gaveUp && (
          <div role="status">
            <h1 className="text-2xl font-bold text-yellow-400 mb-2">Still processing</h1>
            <p className="text-gray-400 mb-6">
              We haven't received confirmation yet. If you were charged, your tickets will appear in My orders shortly.
            </p>
          </div>
        )}
        {state === 'success' && (
          <div role="status">
            <h1 className="text-2xl font-bold text-green-400 mb-2">You're in!</h1>
            <p className="text-gray-400 mb-6">Payment confirmed and your tickets are ready.</p>
          </div>
        )}
        {state === 'failed' && (
          <div role="alert">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Payment not completed</h1>
            <p className="text-gray-400 mb-6">{message || 'The payment failed or was cancelled. You have not been charged for tickets.'}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {eventId && <Link to={`/event/${eventId}`} className="btn-primary">Back to event</Link>}
          <Link to="/orders" className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700">My orders</Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutStatus;
