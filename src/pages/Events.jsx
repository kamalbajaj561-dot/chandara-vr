import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Radio } from 'lucide-react';
import { getEvents } from '../services/eventService';
import { formatCurrency, formatDateTime } from '../utils/formatDate';
import Footer from '../components/Footer';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live now' },
  { id: 'approved', label: 'Upcoming' },
  { id: 'ended', label: 'Completed' },
];

const STATUS_LABEL = { live: 'LIVE', approved: 'Upcoming', ended: 'Completed' };

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const result = await getEvents(tab === 'all' ? {} : { status: tab });
      if (cancelled) return;
      if (result.success) {
        // Only publicly visible states; drafts/pending/rejected never show in discovery.
        setEvents(result.events.filter((e) => STATUS_LABEL[e.status]));
      } else {
        setError('Could not load events. Please try again.');
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tab]);

  const sports = useMemo(
    () => ['all', ...Array.from(new Set(events.map((e) => e.sport).filter(Boolean))).sort()],
    [events]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter(
      (e) =>
        (sport === 'all' || e.sport === sport) &&
        (!q || `${e.title || ''} ${e.sport || ''}`.toLowerCase().includes(q))
    );
  }, [events, search, sport]);

  return (
    <div className="min-h-screen bg-darkerBlue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Discover events</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or sport"
              className="input-field pl-9"
            />
          </div>
          <select
            aria-label="Filter by sport"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="input-field md:w-56"
          >
            {sports.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All sports' : s}</option>
            ))}
          </select>
        </div>

        <div role="tablist" aria-label="Event status" className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm ${
                tab === t.id ? 'bg-gold text-darkerBlue font-semibold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-400" role="status">Loading events...</p>}
        {error && <p className="text-red-400" role="alert">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <div className="card text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-600" aria-hidden="true" />
            No events match your filters.
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visible.map((event) => (
            <Link
              key={event.id}
              to={`/event/${event.id}`}
              className="card p-0 overflow-hidden hover:ring-1 hover:ring-gold transition"
            >
              {event.thumbnail ? (
                <img src={event.thumbnail} alt="" loading="lazy" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
                  <Radio className="w-8 h-8 text-gray-600" aria-hidden="true" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-gray-400">{event.sport}</span>
                  <span className={event.status === 'live' ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                    {STATUS_LABEL[event.status]}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-2 truncate">{event.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gold font-semibold">
                    {event.ticketPrice > 0 ? formatCurrency(event.ticketPrice) : 'Free'}
                  </span>
                  <span className="text-gray-400 text-sm">{formatDateTime(event.date)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Events;
