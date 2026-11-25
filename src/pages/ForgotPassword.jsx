import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    const result = await resetPassword(email.trim());
    setLoading(false);
    if (result.success) setSent(true);
    else setError(result.error);
  };

  return (
    <div className="min-h-screen bg-darkerBlue flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-3xl font-bold text-center mb-2 text-white">Reset password</h1>
          {sent ? (
            <div role="status" className="text-center">
              <p className="text-gray-300 mt-4 mb-6">
                If an account exists for <span className="text-white">{email}</span>, a reset link is on its way.
                Check your inbox and spam folder.
              </p>
              <Link to="/login" className="btn-primary inline-block">Back to sign in</Link>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-center mb-8">We'll email you a link to choose a new password.</p>
              {error && (
                <div role="alert" className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                  <label htmlFor="reset-email" className="block text-gray-300 mb-2">Email</label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="Enter your email"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
              <p className="text-center text-gray-400 mt-6">
                <Link to="/login" className="text-gold hover:text-goldLight">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
