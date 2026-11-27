import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as admin from '../services/adminService';
import { signOut } from '../services/authService';
import { Users, Calendar, DollarSign, Ticket, Radio, MessageSquare, Flag, Shield, LogOut, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatDate';

const PAGE_SIZE = 20;

/** Shows a metric, or an honest "Unavailable" when the backend could not compute it. */
export const MetricCard = ({ label, value, icon: Icon, format }) => {
  const unavailable = value === null || value === undefined;
  return (
    <div className="card" data-testid={`metric-${label}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className={`text-2xl font-bold ${unavailable ? 'text-gray-500' : 'text-white'}`}>
            {unavailable ? 'Unavailable' : format ? format(value) : value}
          </p>
        </div>
        {Icon && <Icon className="w-8 h-8 text-gold" />}
      </div>
    </div>
  );
};

/** Confirmation dialog for sensitive actions; optionally collects a reason. */
export const ConfirmDialog = ({ title, message, needsReason, busy, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const invalid = needsReason && !reason.trim();
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 mb-4">{message}</p>
        {needsReason && (
          <textarea
            aria-label="Reason"
            className="input-field w-full mb-4"
            rows={3}
            placeholder="Reason (required, saved to the audit log)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={() => onConfirm(reason.trim())} disabled={busy || invalid}>
            {busy ? 'Working…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Pager = ({ page, total, onPage }) => {
  const pages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));
  return (
    <div className="flex items-center justify-between mt-4 text-gray-300" data-testid="pager">
      <span>Page {page} of {pages} · {total ?? 0} total</span>
      <div className="flex gap-2">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <button className="btn-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};

const ErrorBanner = ({ message }) =>
  message ? (
    <div role="alert" className="bg-red-900/40 border border-red-700 text-red-200 rounded px-4 py-3 mb-4 flex gap-2">
      <AlertTriangle className="w-5 h-5 shrink-0" /> {message}
    </div>
  ) : null;

const eventDate = (e) => (e.eventDate ? `${e.eventDate} ${e.eventTime || ''}`.trim() : e.createdAt ? formatDateTime(e.createdAt) : '—');

const OverviewTab = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    admin.getDashboard()
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, []);

  if (loading) return <div className="text-white">Loading overview…</div>;
  const s = data?.summary || {};
  return (
    <div>
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricCard label="Users" value={s.totalUsers} icon={Users} />
        <MetricCard label="Events" value={s.totalEvents} icon={Calendar} />
        <MetricCard label="Pending events" value={s.pendingEvents} icon={Calendar} />
        <MetricCard label="Tickets" value={s.totalTickets} icon={Ticket} />
        <MetricCard label="Streams" value={s.totalStreams} icon={Radio} />
        <MetricCard label="Revenue (paid orders)" value={s.totalRevenue} icon={DollarSign} format={formatCurrency} />
        <MetricCard label="Chat messages" value={s.totalChatMessages} icon={MessageSquare} />
        <MetricCard label="Open chat reports" value={s.pendingReports} icon={Flag} />
      </div>
      <p className="text-gray-500 text-sm">“Unavailable” means the server could not compute that number — it is never shown as zero.</p>
    </div>
  );
};

const EventsTab = () => {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ events: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await admin.listEvents({ page, pageSize: PAGE_SIZE, status }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const run = async (reason) => {
    setBusy(true);
    try {
      await confirm.run(reason);
      setConfirm(null);
      await load();
    } catch (e) {
      setError(e.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const ask = (title, message, runFn, needsReason = false) => setConfirm({ title, message, run: runFn, needsReason });

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="mb-4">
        <label className="text-gray-300 mr-2" htmlFor="event-status">Status</label>
        <select id="event-status" className="input-field" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {['pending', 'draft', 'scheduled', 'live', 'ended', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <div className="text-white">Loading events…</div> : data.events.length === 0 ? (
        <div className="card text-gray-400">No {status} events.</div>
      ) : (
        <div className="space-y-3">
          {data.events.map((ev) => (
            <div key={ev.id} className="card flex flex-wrap items-center justify-between gap-3" data-testid="event-row">
              <div>
                <p className="text-white font-semibold">{ev.title}</p>
                <p className="text-gray-400 text-sm">{ev.creatorName || ev.creatorUid} · {eventDate(ev)} · {ev.status}{ev.featured ? ' · featured' : ''}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(ev.status === 'pending' || ev.status === 'draft') && (
                  <>
                    <button className="btn-primary" onClick={() => ask('Approve event', `Approve “${ev.title}” and schedule it?`, () => admin.approveEvent(ev.id))}>Approve</button>
                    <button className="btn-secondary" onClick={() => ask('Reject event', `Reject “${ev.title}”?`, (r) => admin.rejectEvent(ev.id, r), true)}>Reject</button>
                  </>
                )}
                {ev.status === 'scheduled' && (
                  <button className="btn-secondary" onClick={() => ask(ev.featured ? 'Unfeature event' : 'Feature event', `${ev.featured ? 'Remove' : 'Add'} “${ev.title}” ${ev.featured ? 'from' : 'to'} the featured list?`, () => (ev.featured ? admin.unfeatureEvent(ev.id) : admin.featureEvent(ev.id)))}>
                    {ev.featured ? 'Unfeature' : 'Feature'}
                  </button>
                )}
                {['scheduled', 'live'].includes(ev.status) && (
                  <button className="btn-secondary" onClick={() => ask('Cancel event', `Cancel “${ev.title}”? Ticket holders will be affected.`, (r) => admin.cancelEvent(ev.id, r), true)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pager page={page} total={data.total} onPage={setPage} />
      {confirm && <ConfirmDialog title={confirm.title} message={confirm.message} needsReason={confirm.needsReason} busy={busy} onConfirm={run} onCancel={() => setConfirm(null)} />}
    </div>
  );
};

const UsersTab = ({ currentUserId }) => {
  const [input, setInput] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ users: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(term ? await admin.searchUsers(term, { page, pageSize: PAGE_SIZE }) : await admin.listUsers({ page, pageSize: PAGE_SIZE }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, term]);

  useEffect(() => { load(); }, [load]);

  const run = async (reason) => {
    setBusy(true);
    try {
      await confirm.run(reason);
      setConfirm(null);
      await load();
    } catch (e) {
      setError(e.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <ErrorBanner message={error} />
      <form className="flex gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); setPage(1); setTerm(input.trim()); }}>
        <input aria-label="Search users by name" className="input-field flex-1" placeholder="Search by display name (starts with…)" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-primary" type="submit">Search</button>
        {term && <button className="btn-secondary" type="button" onClick={() => { setInput(''); setTerm(''); setPage(1); }}>Clear</button>}
      </form>
      {loading ? <div className="text-white">Loading users…</div> : data.users.length === 0 ? (
        <div className="card text-gray-400">No users found.</div>
      ) : (
        <div className="space-y-3">
          {data.users.map((u) => {
            const banned = u.status === 'banned';
            const self = u.id === currentUserId;
            return (
              <div key={u.id} className="card flex flex-wrap items-center justify-between gap-3" data-testid="user-row">
                <div>
                  <p className="text-white font-semibold">{u.displayName || u.username || u.email}</p>
                  <p className="text-gray-400 text-sm">{u.email} · {u.role} · {u.status || 'active'}</p>
                </div>
                {!self && (
                  <div className="flex gap-2">
                    {banned ? (
                      <button className="btn-secondary" onClick={() => setConfirm({ title: 'Unban user', message: `Restore access for ${u.displayName || u.email}?`, run: () => admin.unbanUser(u.id) })}>Unban</button>
                    ) : (
                      <>
                        {u.status !== 'suspended' && (
                          <button className="btn-secondary" onClick={() => setConfirm({ title: 'Suspend user', message: `Suspend ${u.displayName || u.email}?`, needsReason: true, run: (r) => admin.suspendUser(u.id, r) })}>Suspend</button>
                        )}
                        <button className="btn-secondary" onClick={() => setConfirm({ title: 'Ban user', message: `Ban ${u.displayName || u.email}? They will lose access.`, needsReason: true, run: (r) => admin.banUser(u.id, r) })}>Ban</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!term && <Pager page={page} total={data.total} onPage={setPage} />}
      {confirm && <ConfirmDialog title={confirm.title} message={confirm.message} needsReason={confirm.needsReason} busy={busy} onConfirm={run} onCancel={() => setConfirm(null)} />}
    </div>
  );
};

const AuditTab = () => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ logs: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setLoading(true);
    admin.getAuditLogs({ page, pageSize: PAGE_SIZE })
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [page]);

  return (
    <div>
      <ErrorBanner message={error} />
      {loading ? <div className="text-white">Loading audit log…</div> : data.logs.length === 0 ? (
        <div className="card text-gray-400">No audit entries yet.</div>
      ) : (
        <div className="space-y-2">
          {data.logs.map((l) => (
            <div key={l.id} className="card text-sm text-gray-300" data-testid="audit-row">
              <span className="text-white font-semibold">{l.action}</span> on {l.targetType || l.target} {l.targetId} by {l.adminName || l.adminId} · {l.timestamp ? formatDateTime(l.timestamp) : ''}
            </div>
          ))}
        </div>
      )}
      <Pager page={page} total={data.total} onPage={setPage} />
    </div>
  );
};

const TABS = [
  ['overview', 'Overview'],
  ['events', 'Events'],
  ['users', 'Users'],
  ['audit', 'Audit log'],
];

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (loading) {
    return <div className="min-h-screen bg-darkerBlue flex items-center justify-center text-white">Loading…</div>;
  }
  // UI gate only — the backend independently enforces the administrator role on every /admin request.
  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen bg-darkerBlue flex items-center justify-center text-white">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-darkerBlue">
      <header className="bg-darkBlue border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gold">Chandara VR - Admin</Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-gold" /><span className="text-white">Admin Panel</span></div>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-white flex items-center gap-1"><LogOut className="w-4 h-4" /> Sign out</button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="flex gap-2 mb-6 border-b border-gray-800" role="tablist">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 -mb-px border-b-2 ${activeTab === id ? 'border-gold text-gold' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </nav>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'users' && <UsersTab currentUserId={user.uid || user.id} />}
        {activeTab === 'audit' && <AuditTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;
