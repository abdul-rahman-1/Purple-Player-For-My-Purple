// src/components/LoginForm.jsx

import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export default function LoginForm({ onSwitchToRegister }) {
  const { loginUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      await loginUser(email, password);
    } catch (err) {
      // More helpful error messages
      if (err.message.includes('Failed to fetch')) {
        setError('⚠️ Server unreachable. Please check your connection or try again.');
      } else if (err.message.includes('404')) {
        setError('🚫 API endpoint not found. Check your backend URL.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content login-modal">
        <div className="modal-header">
          <h2>💜 Welcome Back</h2>
          <p>Log in to Purple Player</p>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="your@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : '🔐 Log In'}
          </button>
        </form>

        <div className="form-footer">
          <p>
            Don’t have an account?{' '}
            <button type="button" className="link-button" onClick={onSwitchToRegister}>
              Sign up
            </button>
          </p>
        </div>

        <p className="modal-footer">🔒 Your login is secure and encrypted</p>
      </div>
    </div>
  );
}
