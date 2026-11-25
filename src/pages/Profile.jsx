import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../services/userService';
import { resetPassword } from '../services/authService';

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [country, setCountry] = useState(user?.country || '');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 80) {
      setMessage({ type: 'error', text: 'Name must be 2-80 characters.' });
      return;
    }
    setSaving(true);
    // Only these two fields are editable here; role/status are never sent from the client.
    const result = await updateUser(user.uid, { name: cleanName, country: country.trim().slice(0, 56) });
    setSaving(false);
    setMessage(result.success
      ? { type: 'success', text: 'Profile updated.' }
      : { type: 'error', text: 'Could not save your profile. Try again.' });
  };

  const changePassword = async () => {
    const result = await resetPassword(user.email);
    setMessage(result.success
      ? { type: 'success', text: `Password reset link sent to ${user.email}.` }
      : { type: 'error', text: result.error });
  };

  return (
    <div className="min-h-screen bg-darkerBlue">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Your profile</h1>
        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`px-4 py-3 rounded-lg mb-6 border ${
              message.type === 'error'
                ? 'bg-red-600/20 border-red-600 text-red-400'
                : 'bg-green-600/20 border-green-600 text-green-400'
            }`}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={save} className="card space-y-5">
          <div>
            <label htmlFor="p-email" className="block text-gray-300 mb-2">Email</label>
            <input id="p-email" className="input-field opacity-60" value={user?.email || ''} readOnly />
          </div>
          <div>
            <label htmlFor="p-name" className="block text-gray-300 mb-2">Full name</label>
            <input id="p-name" className="input-field" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-country" className="block text-gray-300 mb-2">Country</label>
            <input id="p-country" className="input-field" value={country} maxLength={56} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" onClick={changePassword} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700">
              Email me a password reset link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
