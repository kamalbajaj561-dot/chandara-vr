import { apiRequest } from './apiClient';

export const getNotifications = (limit = 50) => apiRequest(`/notifications?limit=${limit}`);
export const getUnreadCount = async () => (await apiRequest('/notifications/unread-count'))?.count ?? 0;
export const markRead = (id) => apiRequest(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' });
export const markAllRead = () => apiRequest('/notifications/read-all', { method: 'PUT' });
