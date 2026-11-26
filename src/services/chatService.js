import { apiRequest } from './apiClient';

const enc = encodeURIComponent;

export const getMessages = (eventId, limit = 50) => apiRequest(`/chat/${enc(eventId)}/messages?limit=${limit}`);
export const sendMessage = (eventId, message) =>
  apiRequest(`/chat/${enc(eventId)}/messages`, { method: 'POST', body: { message, messageType: 'text' } });
export const deleteMessage = (messageId) => apiRequest(`/chat/messages/${enc(messageId)}`, { method: 'DELETE' });
export const muteUser = (eventId, userId) => apiRequest('/chat/mute', { method: 'POST', body: { eventId, userId } });
export const reportMessage = (messageId, reason) =>
  apiRequest('/chat/report', { method: 'POST', body: { messageId, reason } });
