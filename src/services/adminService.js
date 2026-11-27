import { apiRequest } from './apiClient';

/**
 * Admin API client. Every call goes to the backend /admin/* routes, which verify the
 * Firebase token AND the administrator role server-side. Nothing here touches Firestore directly.
 */

const qs = (params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

const enc = encodeURIComponent;

export const getDashboard = () => apiRequest('/admin/dashboard');

export const listUsers = ({ page = 1, pageSize = 20, status, role } = {}) =>
  apiRequest(`/admin/users${qs({ page, pageSize, status, role })}`);

export const searchUsers = (query, { page = 1, pageSize = 20 } = {}) =>
  apiRequest(`/admin/users/search${qs({ query, page, pageSize })}`);

export const suspendUser = (id, reason) => apiRequest(`/admin/users/${enc(id)}/suspend`, { method: 'POST', body: { reason } });
export const banUser = (id, reason) => apiRequest(`/admin/users/${enc(id)}/ban`, { method: 'POST', body: { reason } });
export const unbanUser = (id) => apiRequest(`/admin/users/${enc(id)}/unban`, { method: 'POST', body: {} });

export const listEvents = ({ page = 1, pageSize = 20, status } = {}) =>
  apiRequest(`/admin/events${qs({ page, pageSize, status })}`);

export const approveEvent = (id) => apiRequest(`/admin/events/${enc(id)}/approve`, { method: 'POST', body: {} });
export const rejectEvent = (id, reason) => apiRequest(`/admin/events/${enc(id)}/reject`, { method: 'POST', body: { reason } });
export const featureEvent = (id) => apiRequest(`/admin/events/${enc(id)}/feature`, { method: 'POST', body: {} });
export const unfeatureEvent = (id) => apiRequest(`/admin/events/${enc(id)}/unfeature`, { method: 'POST', body: {} });
export const cancelEvent = (id, reason) => apiRequest(`/admin/events/${enc(id)}/cancel`, { method: 'POST', body: { reason } });

export const getAuditLogs = ({ page = 1, pageSize = 25 } = {}) =>
  apiRequest(`/admin/audit${qs({ page, pageSize })}`);
