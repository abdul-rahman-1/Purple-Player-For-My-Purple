import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export default function RegisterModal() {
  const { user, registerUser } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return null; // Don't show if already registered

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerUser(name, email);
      // Modal will auto-hide when user is set
    } catch (err) {
      setError('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content register-modal">
        <div className="modal-header">
          <h2>💜 Welcome to Purple Player</h2>
          <p>Tell us who you are</p>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="e.g., Samra ( Purple )"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <p className="modal-hint">
            Your info is saved securely. We use it to show your online status to the other person.
          </p>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating account...' : '💜 Enter Purple Player'}
          </button>
        </form>

        <p className="modal-footer">
          ✨ Only you and one other person will see this information
        </p>
      </div>
    </div>
  );
}
