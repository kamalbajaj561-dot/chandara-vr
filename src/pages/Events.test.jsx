import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Events from './Events';
import { getEvents } from '../services/eventService';

vi.mock('../services/eventService');
vi.mock('../components/Footer', () => ({ default: () => null }));

const events = [
  { id: '1', title: 'Cup Final', sport: 'Football', status: 'live', ticketPrice: 0, date: '2026-12-01T10:00:00Z' },
  { id: '2', title: 'Test Match', sport: 'Cricket', status: 'approved', ticketPrice: 20, date: '2026-12-02T10:00:00Z' },
  { id: '3', title: 'Hidden Draft', sport: 'Cricket', status: 'pending', ticketPrice: 5, date: '2026-12-03T10:00:00Z' },
];
const renderPage = () => render(<MemoryRouter><Events /></MemoryRouter>);

describe('Events discovery', () => {
  it('lists public events and hides non-public statuses', async () => {
    getEvents.mockResolvedValue({ success: true, events });
    renderPage();
    expect(await screen.findByText('Cup Final')).toBeInTheDocument();
    expect(screen.getByText('Test Match')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Draft')).not.toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('filters by search text', async () => {
    getEvents.mockResolvedValue({ success: true, events });
    renderPage();
    await screen.findByText('Cup Final');
    await userEvent.type(screen.getByLabelText('Search events'), 'cricket');
    expect(screen.queryByText('Cup Final')).not.toBeInTheDocument();
    expect(screen.getByText('Test Match')).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    getEvents.mockResolvedValue({ success: true, events });
    renderPage();
    await screen.findByText('Cup Final');
    await userEvent.type(screen.getByLabelText('Search events'), 'zzz');
    expect(screen.getByText(/no events match/i)).toBeInTheDocument();
  });

  it('shows an error state when loading fails', async () => {
    getEvents.mockResolvedValue({ success: false, error: 'boom' });
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not load events/i));
  });

  it('re-queries with the status when a tab is chosen', async () => {
    getEvents.mockResolvedValue({ success: true, events });
    renderPage();
    await screen.findByText('Cup Final');
    await userEvent.click(screen.getByRole('tab', { name: /live now/i }));
    await waitFor(() => expect(getEvents).toHaveBeenLastCalledWith({ status: 'live' }));
  });
});
