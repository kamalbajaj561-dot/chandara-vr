import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Trash2, VolumeX } from 'lucide-react';
import { getMessages, sendMessage, deleteMessage, muteUser } from '../services/chatService';

const POLL_MS = 4000;
const MAX_LEN = 500;

const toMillis = (v) => {
  if (!v) return 0;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v).getTime() || 0;
  if (typeof v._seconds === 'number') return v._seconds * 1000;
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  return 0;
};

/** Live chat backed by the Chandara API (polling). Moderation actions are re-checked by the server. */
const ChatPanel = ({ eventId, user, canModerate = false }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await getMessages(eventId);
      const list = (Array.isArray(data) ? data : data?.messages || [])
        .filter((m) => !m.isDeleted)
        .sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
      setMessages(list);
      setLoadError('');
    } catch (e) {
      setLoadError(e.message || 'Could not load chat.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [user, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages.length]);

  const onSend = async (e) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setActionError('');
    try {
      await sendMessage(eventId, message);
      setText('');
      await load();
    } catch (err) {
      setActionError(err.message || 'Message not sent.');
    } finally {
      setSending(false);
    }
  };

  const onDelete = async (id) => {
    setActionError('');
    try {
      await deleteMessage(id);
      setMessages((prev) => prev.filter((m) => (m.id || m.messageId) !== id));
    } catch (err) {
      setActionError(err.message || 'Could not delete the message.');
    }
  };

  const onMute = async (senderId) => {
    setActionError('');
    try {
      await muteUser(eventId, senderId);
      setActionError('User muted.');
    } catch (err) {
      setActionError(err.message || 'Could not mute the user.');
    }
  };

  return (
    <div className="card h-[calc(100vh-200px)] min-h-[320px] flex flex-col">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-gold" aria-hidden="true" />
        <h3 className="font-semibold text-white">Live Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
        {!user && <p className="text-gray-500 text-center text-sm">Sign in to read and join the chat.</p>}
        {user && loading && <p className="text-gray-500 text-center text-sm">Loading chat...</p>}
        {user && loadError && (
          <p role="alert" className="text-red-400 text-center text-sm">
            {loadError}{' '}
            <button type="button" className="underline" onClick={load}>Retry</button>
          </p>
        )}
        {user && !loading && !loadError && messages.length === 0 && (
          <p className="text-gray-500 text-center text-sm">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const id = m.id || m.messageId;
          return (
            <div key={id} className="text-sm group flex items-start gap-2">
              <div className="flex-1 break-words">
                <span className="text-gold font-semibold">{m.senderName || 'Viewer'}: </span>
                <span className="text-gray-300">{m.message}</span>
              </div>
              {canModerate && m.senderId !== user?.uid && (
                <span className="flex gap-1 opacity-60 group-hover:opacity-100">
                  <button type="button" aria-label={`Delete message from ${m.senderName || 'viewer'}`} onClick={() => onDelete(id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                  <button type="button" aria-label={`Mute ${m.senderName || 'viewer'}`} onClick={() => onMute(m.senderId)}>
                    <VolumeX className="w-4 h-4 text-yellow-400" />
                  </button>
                </span>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {actionError && <p role="status" className="px-4 pb-2 text-xs text-yellow-400">{actionError}</p>}

      <div className="p-4 border-t border-gray-800">
        <form onSubmit={onSend} className="flex gap-2">
          <input
            type="text"
            aria-label="Chat message"
            value={text}
            maxLength={MAX_LEN}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? 'Type a message...' : 'Sign in to chat'}
            disabled={!user}
            className="flex-1 bg-darkerBlue border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!user || !text.trim() || sending}
            className="bg-gold text-black px-3 py-2 rounded-lg hover:bg-goldLight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
