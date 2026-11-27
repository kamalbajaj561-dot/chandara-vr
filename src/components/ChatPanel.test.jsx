import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPanel from './ChatPanel';
import * as chat from '../services/chatService';
import { connectChatSocket } from '../services/chatSocket';

vi.mock('../services/chatService');
vi.mock('../services/chatSocket', () => ({ connectChatSocket: vi.fn() }));

let handlers;
const close = vi.fn();

const msgs = [
  { id: 'm2', senderId: 'u2', senderName: 'Bea', message: 'second', createdAt: '2026-01-01T10:00:02Z' },
  { id: 'm1', senderId: 'u3', senderName: 'Al', message: 'first', createdAt: '2026-01-01T10:00:01Z' },
  { id: 'm0', senderId: 'u4', senderName: 'Gone', message: 'deleted one', isDeleted: true, createdAt: '2026-01-01T10:00:00Z' },
];
const me = { uid: 'me', name: 'Me' };

describe('ChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chat.getMessages.mockResolvedValue(msgs);
    connectChatSocket.mockImplementation((eventId, h) => { handlers = h; return { close }; });
  });

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

  describe('real-time', () => {
    it('connects once per event and closes on unmount', async () => {
      const { unmount } = render(<ChatPanel eventId="e1" user={me} />);
      await screen.findByText('first');
      expect(connectChatSocket).toHaveBeenCalledWith('e1', expect.any(Object));
      unmount();
      expect(close).toHaveBeenCalled();
    });

    it('does not open a socket for anonymous users', () => {
      render(<ChatPanel eventId="e1" user={null} />);
      expect(connectChatSocket).not.toHaveBeenCalled();
    });

    it('shows live messages instantly and ignores duplicates (REST + socket echo)', async () => {
      render(<ChatPanel eventId="e1" user={me} />);
      await screen.findByText('first');
      act(() => handlers.onMessage({ id: 'm9', senderId: 'u5', senderName: 'Cy', message: 'live one', createdAt: '2026-01-01T10:01:00Z' }));
      act(() => handlers.onMessage({ id: 'm9', senderId: 'u5', senderName: 'Cy', message: 'live one', createdAt: '2026-01-01T10:01:00Z' }));
      expect(screen.getAllByText('live one')).toHaveLength(1);
    });

    it('removes messages deleted by a moderator in real time', async () => {
      render(<ChatPanel eventId="e1" user={me} />);
      await screen.findByText('first');
      act(() => handlers.onMessageRemoved({ messageId: 'm1' }));
      expect(screen.queryByText('first')).not.toBeInTheDocument();
    });

    it('reflects connection state', async () => {
      render(<ChatPanel eventId="e1" user={me} />);
      await screen.findByText('first');
      expect(screen.getByTestId('chat-connection')).toHaveTextContent('Connecting...');
      act(() => handlers.onJoined());
      expect(screen.getByTestId('chat-connection')).toHaveTextContent('Live');
      act(() => handlers.onDisconnected('transport close'));
      expect(screen.getByTestId('chat-connection')).toHaveTextContent('Reconnecting...');
    });

    it('tells the user when muted and when the server denies the chat (no ticket)', async () => {
      render(<ChatPanel eventId="e1" user={me} />);
      await screen.findByText('first');
      act(() => handlers.onMuteChanged({ userId: 'someone-else', muted: true }));
      expect(screen.queryByText(/muted by a moderator/i)).not.toBeInTheDocument();
      act(() => handlers.onMuteChanged({ userId: 'me', muted: true }));
      expect(screen.getByText(/muted by a moderator/i)).toBeInTheDocument();
      act(() => handlers.onDenied('A valid ticket is required to watch this event'));
      expect(screen.getByText(/valid ticket is required/i)).toBeInTheDocument();
      expect(screen.getByTestId('chat-connection')).toHaveTextContent('Chat unavailable');
      expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
    });
  });
});
