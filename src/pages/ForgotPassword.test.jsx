import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import { resetPassword } from '../services/authService';

vi.mock('../services/authService');
const renderPage = () => render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

describe('ForgotPassword', () => {
  it('rejects malformed emails without calling the service', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Email'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid email/i);
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('shows a neutral confirmation that does not reveal whether the account exists', async () => {
    resetPassword.mockResolvedValue({ success: true });
    renderPage();
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/if an account exists/i);
  });
});
