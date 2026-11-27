import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const authState = { user: { uid: 'admin-1', role: 'admin' }, loading: false };
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }));
vi.mock('../services/authService', () => ({ signOut: vi.fn() }));
vi.mock('../services/adminService', () => ({
  getDashboard: vi.fn(),
  listUsers: vi.fn(),
  searchUsers: vi.fn(),
  suspendUser: vi.fn(),
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  listEvents: vi.fn(),
  approveEvent: vi.fn(),
  rejectEvent: vi.fn(),
  featureEvent: vi.fn(),
  unfeatureEvent: vi.fn(),
  cancelEvent: vi.fn(),
  getAuditLogs: vi.fn(),
}));

import * as admin from '../services/adminService';
import AdminDashboard from './AdminDashboard';

const renderPage = () => render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  authState.user = { uid: 'admin-1', role: 'admin' };
  authState.loading = false;
  admin.getDashboard.mockResolvedValue({ summary: { totalUsers: 12, totalEvents: 3, pendingEvents: 1, totalTickets: null, totalStreams: 0, totalRevenue: null, totalChatMessages: 40, pendingReports: 2 } });
});

describe('AdminDashboard', () => {
  it('denies non-admin users without calling the backend', () => {
    authState.user = { uid: 'u1', role: 'user' };
    renderPage();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(admin.getDashboard).not.toHaveBeenCalled();
  });

  it('shows real numbers and "Unavailable" (never 0) for null metrics', async () => {
    renderPage();
    const users = await screen.findByTestId('metric-Users');
    expect(within(users).getByText('12')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-Tickets')).getByText('Unavailable')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-Revenue (paid orders)')).getByText('Unavailable')).toBeInTheDocument();
    // a genuine zero is still shown as 0
    expect(within(screen.getByTestId('metric-Streams')).getByText('0')).toBeInTheDocument();
  });

  it('shows a backend error instead of fake data', async () => {
    admin.getDashboard.mockRejectedValue(new Error('Forbidden'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden');
  });

  it('approves a pending event only after confirmation', async () => {
    admin.listEvents.mockResolvedValue({ events: [{ id: 'e1', title: 'Final', status: 'pending', creatorName: 'Sam' }], total: 1 });
    admin.approveEvent.mockResolvedValue({ success: true });
    renderPage();
    await userEvent.click(screen.getByRole('tab', { name: 'Events' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));
    expect(admin.approveEvent).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(admin.approveEvent).toHaveBeenCalledWith('e1'));
    await waitFor(() => expect(admin.listEvents).toHaveBeenCalledTimes(2));
  });

  it('requires a reason to reject an event', async () => {
    admin.listEvents.mockResolvedValue({ events: [{ id: 'e1', title: 'Final', status: 'pending' }], total: 1 });
    admin.rejectEvent.mockResolvedValue({ success: true });
    renderPage();
    await userEvent.click(screen.getByRole('tab', { name: 'Events' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Reject' }));
    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'Inappropriate');
    await userEvent.click(confirm);
    await waitFor(() => expect(admin.rejectEvent).toHaveBeenCalledWith('e1', 'Inappropriate'));
  });

  it('bans a user with a reason and paginates the user list', async () => {
    admin.listUsers.mockResolvedValue({ users: [
      { id: 'u1', displayName: 'Ann', email: 'a@x.com', role: 'viewer', status: 'active' },
      { id: 'admin-1', displayName: 'Me', email: 'me@x.com', role: 'administrator', status: 'active' },
    ], total: 45 });
    admin.banUser.mockResolvedValue({ success: true });
    renderPage();
    await userEvent.click(screen.getByRole('tab', { name: 'Users' }));
    const rows = await screen.findAllByTestId('user-row');
    // admins cannot act on their own account
    expect(within(rows[1]).queryByRole('button')).toBeNull();
    await userEvent.click(within(rows[0]).getByRole('button', { name: 'Ban' }));
    await userEvent.type(screen.getByLabelText('Reason'), 'Spam');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(admin.banUser).toHaveBeenCalledWith('u1', 'Spam'));
    expect(screen.getByTestId('pager')).toHaveTextContent('Page 1 of 3');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(admin.listUsers).toHaveBeenLastCalledWith({ page: 2, pageSize: 20 }));
  });

  it('searches users through the backend search endpoint', async () => {
    admin.listUsers.mockResolvedValue({ users: [], total: 0 });
    admin.searchUsers.mockResolvedValue({ users: [{ id: 'u2', displayName: 'Bob', email: 'b@x.com', role: 'viewer', status: 'banned' }], total: 1 });
    renderPage();
    await userEvent.click(screen.getByRole('tab', { name: 'Users' }));
    await userEvent.type(await screen.findByLabelText('Search users by name'), 'Bo');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Bob')).toBeInTheDocument();
    expect(admin.searchUsers).toHaveBeenCalledWith('Bo', { page: 1, pageSize: 20 });
    expect(screen.getByRole('button', { name: 'Unban' })).toBeInTheDocument();
  });
});
