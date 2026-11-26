import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, getMyRefunds, cancelOrder, requestRefund } from '../services/checkoutService';
import { ORDER_STATUS_LABEL, canCancelOrder, canRequestRefund } from '../utils/checkoutState';
import { formatCurrency, formatDateTime } from '../utils/formatDate';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [o, r] = await Promise.all([getMyOrders(), getMyRefunds().catch(() => [])]);
      setOrders(Array.isArray(o) ? o : []);
      setRefunds(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, fn) => {
    setBusy(id);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="min-h-screen bg-darkerBlue">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">My orders</h1>
        {error && <p role="alert" className="text-red-400 mb-4">{error}</p>}
        {loading && <p role="status" className="text-gray-400">Loading orders...</p>}
        {!loading && !error && orders.length === 0 && (
          <div className="card text-center text-gray-400">
            No orders yet. <Link to="/events" className="text-gold">Browse events</Link>
          </div>
        )}
        <ul className="space-y-4">
          {orders.map((order) => {
            const orderRefunds = refunds.filter((r) => r.orderId === order.orderId);
            return (
              <li key={order.orderId} className="card">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <Link to={`/event/${order.eventId}`} className="text-white font-semibold hover:text-gold">
                    Event {order.eventId}
                  </Link>
                  <span className={order.status === 'paid' ? 'text-green-400' : order.status === 'failed' || order.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'}>
                    {ORDER_STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {formatCurrency(order.total)} · {order.createdAt ? formatDateTime(order.createdAt) : ''} · {order.ticketIds?.length || 0} ticket(s)
                </p>
                {orderRefunds.map((r) => (
                  <p key={r.refundId} className="text-sm text-gray-400 mt-1">Refund {r.status} ({formatCurrency(r.amount)})</p>
                ))}
                <div className="flex gap-3 mt-3">
                  {canCancelOrder(order) && (
                    <button
                      disabled={busy === order.orderId}
                      onClick={() => act(order.orderId, () => cancelOrder(order.orderId))}
                      className="px-3 py-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700 text-sm"
                    >Cancel order</button>
                  )}
                  {canRequestRefund(order, orderRefunds) && (
                    <button
                      disabled={busy === order.orderId}
                      onClick={() => act(order.orderId, () => requestRefund(order, 'Requested by customer'))}
                      className="px-3 py-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700 text-sm"
                    >Request refund</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Orders;
