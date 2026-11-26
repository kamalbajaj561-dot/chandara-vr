import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const rooms = [];
vi.mock('livekit-client', () => {
  class FakeRoom {
    constructor() {
      this.handlers = {};
      this.remoteParticipants = new Map();
      this.localParticipant = { identity: 'me' };
      this.canPlaybackAudio = true;
      this.disconnect = vi.fn(async () => {});
      this.connect = vi.fn(async () => {});
      rooms.push(this);
    }
    on(evt, fn) { (this.handlers[evt] ||= []).push(fn); return this; }
    off() { return this; }
    removeAllListeners() { this.handlers = {}; }
    emit(evt, ...args) { (this.handlers[evt] || []).forEach((fn) => fn(...args)); }
  }
  return {
    Room: FakeRoom,
    RoomEvent: {
      Connected: 'connected', Disconnected: 'disconnected', Reconnecting: 'reconnecting', Reconnected: 'reconnected',
      ParticipantConnected: 'pc', ParticipantDisconnected: 'pd', TrackSubscribed: 'ts', TrackUnsubscribed: 'tu',
      TrackSubscriptionFailed: 'tsf', ConnectionStateChanged: 'csc', AudioPlaybackStatusChanged: 'aps',
    },
    TrackType: { VIDEO: 'video', AUDIO: 'audio' },
    DisconnectReason: { CLIENT_INITIATED: 1, ROOM_DELETED: 4, PARTICIPANT_REMOVED: 3, DUPLICATE_IDENTITY: 2, SERVER_SHUTDOWN: 5 },
  };
});
vi.mock('../services/livekitService', () => ({
  generateLiveKitToken: vi.fn(async () => ({ success: true, token: 't', url: 'ws://x' })),
  getLiveKitURL: () => 'ws://x',
}));

import Viewer from './Viewer';
import { generateLiveKitToken } from '../services/livekitService';

const renderViewer = () =>
  render(
    <MemoryRouter initialEntries={['/viewer/ev1']}>
      <Routes>
        <Route path="/viewer/:eventId" element={<Viewer />} />
        <Route path="/event/:id" element={<div>event page</div>} />
      </Routes>
    </MemoryRouter>
  );
const join = async () => {
  await userEvent.click(screen.getByRole('button', { name: /join|connect/i }));
  await act(async () => {});
};

describe('Viewer connection handling', () => {
  beforeEach(() => { rooms.length = 0; vi.clearAllMocks(); });
  afterEach(() => { vi.useRealTimers(); });

  it('disconnects the LiveKit room when the page is left (no leaked connection)', async () => {
    const { unmount } = renderViewer();
    await join();
    expect(rooms).toHaveLength(1);
    unmount();
    expect(rooms[0].disconnect).toHaveBeenCalled();
  });

  it('shows Reconnecting then Connected on a transient network drop', async () => {
    renderViewer();
    await join();
    act(() => rooms[0].emit('connected'));
    act(() => rooms[0].emit('reconnecting'));
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
    act(() => rooms[0].emit('reconnected'));
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('reports the stream as ended (no retry) when the room is deleted', async () => {
    renderViewer();
    await join();
    act(() => rooms[0].emit('connected'));
    act(() => rooms[0].emit('disconnected', 4));
    expect(screen.getByText('Stream ended')).toBeInTheDocument();
    expect(generateLiveKitToken).toHaveBeenCalledTimes(1);
  });

  it('retries with a fresh token after an unexpected disconnect', async () => {
    renderViewer();
    await join();
    vi.useFakeTimers();
    act(() => rooms[0].emit('connected'));
    act(() => rooms[0].emit('disconnected', 5));
    expect(screen.getByText(/Reconnecting \(attempt 1\/3\)/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(2500); });
    expect(generateLiveKitToken).toHaveBeenCalledTimes(2);
    expect(rooms).toHaveLength(2);
  });

  it('shows a clear error when the server refuses the token', async () => {
    generateLiveKitToken.mockResolvedValueOnce({ success: false, error: 'A valid ticket is required to watch this event' });
    renderViewer();
    await join();
    expect(screen.getByText(/valid ticket is required/i)).toBeInTheDocument();
    expect(rooms).toHaveLength(0);
  });
});
