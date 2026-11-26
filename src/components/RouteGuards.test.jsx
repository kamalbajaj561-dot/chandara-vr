import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './RouteGuards';

let authState;
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }));

const renderAt = (path, guard) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>home</div>} />
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/admin" element={<div>admin home</div>} />
        <Route path="/dashboard" element={<div>user dashboard</div>} />
        <Route path="/secret" element={guard} />
        <Route path="/public" element={guard} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => { authState = { user: null, loading: false }; });

  it('redirects anonymous visitors to login', () => {
    renderAt('/secret', <ProtectedRoute><div>secret</div></ProtectedRoute>);
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('shows a loading state while auth resolves, never the content', () => {
    authState = { user: null, loading: true };
    renderAt('/secret', <ProtectedRoute><div>secret</div></ProtectedRoute>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('blocks a normal user from an admin-only route', () => {
    authState = { user: { uid: 'u1', role: 'user' }, loading: false };
    renderAt('/secret', <ProtectedRoute requiredRole="admin"><div>secret</div></ProtectedRoute>);
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('lets the required role through', () => {
    authState = { user: { uid: 'a1', role: 'admin' }, loading: false };
    renderAt('/secret', <ProtectedRoute requiredRole="admin"><div>secret</div></ProtectedRoute>);
    expect(screen.getByText('secret')).toBeInTheDocument();
  });
});

describe('PublicRoute', () => {
  it('sends signed-in users to their dashboard', () => {
    authState = { user: { uid: 'u1', role: 'user' }, loading: false };
    renderAt('/public', <PublicRoute><div>login form</div></PublicRoute>);
    expect(screen.getByText('user dashboard')).toBeInTheDocument();
  });
  it('shows the form to anonymous visitors', () => {
    authState = { user: null, loading: false };
    renderAt('/public', <PublicRoute><div>login form</div></PublicRoute>);
    expect(screen.getByText('login form')).toBeInTheDocument();
  });
});
