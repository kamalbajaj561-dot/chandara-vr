import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getNotifications, markRead, markAllRead } from '../services/notificationService';
import { formatDateTime } from '../utils/formatDate';

const toDate = (v) => (v?._seconds ? new Date(v._seconds * 1000) : v);

// Where a notification should take the user, based on data the backend attaches.
export const notificationLink = (n) => {
  if (n.data?.eventId) return `/event/${n.data.eventId}`;
  if (n.data?.orderId) return '/orders';
  return null;
};

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications();
      setItems(Array.isArray(data) ? data : data?.notifications || []);
    } catch (e) {
      setError(e.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unread = items.filter((n) => !n.read).length;

  const open = async (n) => {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.notificationId === n.notificationId ? { ...x, read: true } : x)));
    try { await markRead(n.notificationId); } catch { load(); }
  };

  const readAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    try { await markAllRead(); } catch { load(); }
  };

  return (
    <div className="min-h-screen bg-darkerBlue">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          {unread > 0 && (
            <button type="button" onClick={readAll} className="text-sm text-gold hover:text-goldLight">
              Mark all as read ({unread})
            </button>
          )}
        </div>

        {loading && <p role="status" className="text-gray-400">Loading...</p>}
        {error && (
          <p role="alert" className="text-red-400">
            {error} <button type="button" className="underline" onClick={load}>Retry</button>
          </p>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="card text-center text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-600" aria-hidden="true" />
            You're all caught up.
          </div>
        )}

        <ul className="space-y-3">
          {items.map((n) => {
            const link = notificationLink(n);
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 className={`font-semibold ${n.read ? 'text-gray-300' : 'text-white'}`}>{n.title}</h2>
                  {!n.read && <span aria-label="Unread" className="mt-1.5 w-2 h-2 rounded-full bg-gold shrink-0" />}
                </div>
                <p className="text-gray-400 text-sm mt-1">{n.message}</p>
                <p className="text-gray-500 text-xs mt-2">{formatDateTime(toDate(n.createdAt))}</p>
              </>
            );
            return (
              <li key={n.notificationId} className="card">
                {link ? (
                  <Link to={link} onClick={() => open(n)} className="block">{body}</Link>
                ) : (
                  <button type="button" onClick={() => open(n)} className="block w-full text-left">{body}</button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Notifications;
