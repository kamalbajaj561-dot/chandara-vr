import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPanel from './ChatPanel';
import * as chat from '../services/chatService';

vi.mock('../services/chatService');

const msgs = [
  { id: 'm2', senderId: 'u2', senderName: 'Bea', message: 'second', createdAt: '2026-01-01T10:00:02Z' },
  { id: 'm1', senderId: 'u3', senderName: 'Al', message: 'first', createdAt: '2026-01-01T10:00:01Z' },
  { id: 'm0', senderId: 'u4', senderName: 'Gone', message: 'deleted one', isDeleted: true, createdAt: '2026-01-01T10:00:00Z' },
];
const me = { uid: 'me', name: 'Me' };

describe('ChatPanel', () => {
  beforeEach(() => { vi.clearAllMocks(); chat.getMessages.mockResolvedValue(msgs); });

  it('asks anonymous users to sign in and does not call the API', () => {
    render(<ChatPanel eventId="e1" user={null} />);
    expect(screen.getByText(/sign in to read and join/i)).toBeInTheDocument();
    expect(chat.getMessages).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Chat message')).toBeDisabled();
  });

  it('shows messages oldest-first and hides deleted ones', async () => {
    render(<ChatPanel eventId="e1" user={me} />);
    await screen.findByText('first');
    const text = document.body.textContent;
    expect(text.indexOf('first')).toBeLessThan(text.indexOf('second'));
    expect(screen.queryByText('deleted one')).not.toBeInTheDocument();
  });

  it('sends a message and clears the input', async () => {
    chat.sendMessage.mockResolvedValue({});
    render(<ChatPanel eventId="e1" user={me} />);
    await screen.findByText('first');
    await userEvent.type(screen.getByLabelText('Chat message'), 'hello world');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    await waitFor(() => expect(chat.sendMessage).toHaveBeenCalledWith('e1', 'hello world'));
    expect(screen.getByLabelText('Chat message')).toHaveValue('');
  });

  it('shows the server reason when a send is refused (muted, no ticket, slow mode)', async () => {
    chat.sendMessage.mockRejectedValue(new Error('You are muted in this chat'));
    render(<ChatPanel eventId="e1" user={me} />);
    await screen.findByText('first');
    await userEvent.type(screen.getByLabelText('Chat message'), 'hi');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText('You are muted in this chat')).toBeInTheDocument();
    expect(screen.getByLabelText('Chat message')).toHaveValue('hi');
  });

  it('shows an error with retry when loading fails', async () => {
    chat.getMessages.mockRejectedValueOnce(new Error('Cannot reach the server.'));
    render(<ChatPanel eventId="e1" user={me} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.');
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(await screen.findByText('first')).toBeInTheDocument();
  });

  it('shows moderation controls only to moderators, never on their own messages', async () => {
    const { unmount } = render(<ChatPanel eventId="e1" user={me} canModerate={false} />);
    await screen.findByText('first');
    expect(screen.queryByRole('button', { name: /delete message/i })).not.toBeInTheDocument();
    unmount();

    render(<ChatPanel eventId="e1" user={me} canModerate />);
    await screen.findByText('first');
    expect(screen.getAllByRole('button', { name: /delete message/i })).toHaveLength(2);
  });

  it('deletes and mutes via the API', async () => {
    chat.deleteMessage.mockResolvedValue({});
    chat.muteUser.mockResolvedValue({});
    render(<ChatPanel eventId="e1" user={me} canModerate />);
    await screen.findByText('first');
    await userEvent.click(screen.getByRole('button', { name: 'Mute Al' }));
    expect(chat.muteUser).toHaveBeenCalledWith('e1', 'u3');
    await userEvent.click(screen.getByRole('button', { name: 'Delete message from Al' }));
    await waitFor(() => expect(chat.deleteMessage).toHaveBeenCalledWith('m1'));
    await waitFor(() => expect(screen.queryByText('first')).not.toBeInTheDocument());
  });
});
