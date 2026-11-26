import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Notifications, { notificationLink } from './Notifications';
import * as svc from '../services/notificationService';

vi.mock('../services/notificationService');

const items = [
  { notificationId: 'n1', title: 'Event live', message: 'Cup Final started', read: false, data: { eventId: 'e1' }, createdAt: '2026-01-01T10:00:00Z' },
  { notificationId: 'n2', title: 'Order paid', message: 'Thanks', read: true, data: { orderId: 'o1' }, createdAt: '2026-01-01T09:00:00Z' },
];
const renderPage = () => render(<MemoryRouter><Notifications /></MemoryRouter>);

describe('Notifications', () => {
  beforeEach(() => { vi.clearAllMocks(); svc.getNotifications.mockResolvedValue(items); });

  it('shows unread state and count', async () => {
    renderPage();
    await screen.findByText('Event live');
    expect(screen.getAllByLabelText('Unread')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /mark all as read \(1\)/i })).toBeInTheDocument();
  });

  it('marks a notification read when opened', async () => {
    svc.markRead.mockResolvedValue({});
    renderPage();
    await userEvent.click(await screen.findByText('Event live'));
    expect(svc.markRead).toHaveBeenCalledWith('n1');
    await waitFor(() => expect(screen.queryAllByLabelText('Unread')).toHaveLength(0));
  });

  it('marks all read', async () => {
    svc.markAllRead.mockResolvedValue({});
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /mark all as read/i }));
    expect(svc.markAllRead).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
  });

  it('shows empty and error states', async () => {
    svc.getNotifications.mockResolvedValueOnce([]);
    const { unmount } = renderPage();
    expect(await screen.findByText(/all caught up/i)).toBeInTheDocument();
    unmount();
    svc.getNotifications.mockRejectedValueOnce(new Error('Cannot reach the server.'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.');
  });

  it('links to the related event or orders page', () => {
    expect(notificationLink(items[0])).toBe('/event/e1');
    expect(notificationLink(items[1])).toBe('/orders');
    expect(notificationLink({ data: {} })).toBeNull();
  });
});
