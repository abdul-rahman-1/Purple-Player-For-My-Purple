import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { validatePassword, getPasswordStrengthLabel, getPasswordStrengthColor } from '../utils/passwordValidator';
import '../styles/Profile.css';

const API_KEY = import.meta.env.VITE_API_KEY || 'purple-secret-key-samra-2025';

function getHeaders(additionalHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...additionalHeaders
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateListeningStatus } = useUser();
  const [activeTab, setActiveTab] = useState('personal'); // personal, security, group, danger
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // success, error, info

  // Personal tab states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    avatar: user?.avatar || null,
    avatarPreview: user?.avatar || null
  });

  // Security tab states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(null);

  // Group tab states
  const [groupData, setGroupData] = useState({
    newGroupCode: '',
    showLeaveConfirm: false
  });

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-empty">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  // ============ PERSONAL TAB ============

  const handleNameChange = (e) => {
    setProfileData(prev => ({ ...prev, name: e.target.value }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('Image must be less than 5MB', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showMessage('Please upload an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (img.width !== img.height) {
          showMessage(`Image must be 1:1 ratio (square). Current: ${img.width}x${img.height}`, 'error');
          return;
        }

        setProfileData(prev => ({
          ...prev,
          avatar: event.target.result,
          avatarPreview: event.target.result
        }));
        showMessage('Photo updated (not saved yet)', 'info');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setProfileData(prev => ({ ...prev, avatar: null, avatarPreview: null }));
    showMessage('Photo removed (not saved yet)', 'info');
  };

  const savePersonalInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/users/profile/${user._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: profileData.name,
          avatar: profileData.avatar
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      localStorage.setItem('purpleUser', JSON.stringify(updatedUser));
      showMessage('✅ Profile updated successfully!', 'success');
    } catch (err) {
      showMessage(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============ SECURITY TAB ============

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    if (name === 'newPassword') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const updatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showMessage('All password fields are required', 'error');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    const strength = validatePassword(passwordData.newPassword);
    if (!strength.isValid) {
      showMessage('New password does not meet all requirements', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/users/change-password/${user._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(null);
      showMessage('✅ Password updated successfully!', 'success');
    } catch (err) {
      showMessage(err.message || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendResetEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/users/reset-email/${user._id}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email: user.email })
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

      showMessage('✅ Password reset email sent to abdulrahmanstd955@gmail.com', 'success');
    } catch (err) {
      showMessage(err.message || 'Failed to send reset email', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============ GROUP TAB ============

  const leaveGroup = async () => {
    setLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/users/leave-group/${user._id}`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to leave group');
      }

      const updatedUser = await response.json();
      localStorage.setItem('purpleUser', JSON.stringify(updatedUser));
      showMessage('✅ You have left the group', 'success');
      setGroupData(prev => ({ ...prev, showLeaveConfirm: false }));
      
      // Refresh page after 2 seconds
      setTimeout(() => window.location.href = '/', 2000);
    } catch (err) {
      showMessage(err.message || 'Failed to leave group', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============ DANGER TAB ============

  const [deleteConfirm, setDeleteConfirm] = useState({
    confirmed: false,
    password: ''
  });

const deleteAccount = async () => {
  if (!deleteConfirm.password || !deleteConfirm.confirmed) {
    showMessage('Please confirm and enter your password', 'error');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(
      import.meta.env.VITE_API_URL + `/api/users/delete-account/${user._id}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ password: deleteConfirm.password })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete account');
    }

    showMessage('✅ Account deleted. Logging out...', 'success');

    // ✅ Step 1: Clear local storage
    localStorage.removeItem('purpleUser');

    // ✅ Step 2: Clear React user context (if logout() updates global state)
    logout();

    // ✅ Step 3: Optional — refresh backend session status if any (offline update)
    try {
      await fetch(import.meta.env.VITE_API_URL + `/api/users/offline/${user._id}`, {
        method: 'POST',
        headers: getHeaders()
      });
    } catch {}

    // ✅ Step 4: Redirect after short delay
    setTimeout(() => {
      window.location.href = '/register'; // or '/login'
    }, 1000);

  } catch (err) {
    showMessage(err.message || 'Failed to delete account', 'error');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="profile-container">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Home
      </button>

      <div className="profile-wrapper">
        {/* Header */}
        <div className="profile-header">
          <h1>⚙️ My Profile</h1>
          <p>Manage your account settings and preferences</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`profile-message message-${messageType}`}>
            {message}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            👤 Personal Info
          </button>
          <button
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔐 Security
          </button>
          <button
            className={`tab-button ${activeTab === 'group' ? 'active' : ''}`}
            onClick={() => setActiveTab('group')}
          >
            👥 Group
          </button>
          <button
            className={`tab-button ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            ⚠️ Danger Zone
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {/* PERSONAL TAB */}
          {activeTab === 'personal' && (
            <div className="tab-panel">
              <div className="section">
                <h2>👤 Personal Information</h2>
                
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={handleNameChange}
                    placeholder="Your name"
                    className="form-input"
                  />
                  <small>This is how others see you in the group</small>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="form-input disabled"
                  />
                  <small>To change email, contact support at abdulrahmanstd955@gmail.com</small>
                </div>

                <div className="form-group">
                  <label>Profile Photo</label>
                  <div className="photo-upload-section">
                    {profileData.avatarPreview ? (
                      <div className="photo-preview">
                        <img src={profileData.avatarPreview} alt="Profile preview" />
                        <button
                          type="button"
                          className="btn-remove-photo"
                          onClick={handleRemoveAvatar}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-area">
                        <div className="upload-icon">📷</div>
                        <p>Click to upload a 1:1 square photo</p>
                        <span className="upload-hint">Max 5MB • JPG, PNG</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="photo-input"
                      style={{ display: 'none' }}
                      id="avatar-input"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => document.getElementById('avatar-input').click()}
                    >
                      {profileData.avatarPreview ? '📷 Change Photo' : '📷 Upload Photo'}
                    </button>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={savePersonalInfo}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="tab-panel">
              <div className="section">
                <h2>🔐 Password & Security</h2>

                {/* Change Password */}
                <div className="subsection">
                  <h3>Change Password</h3>
                  
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="form-input"
                    />
                  </div>

                  {passwordStrength && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div
                          className="strength-fill"
                          style={{
                            width: `${(passwordStrength.score / 5) * 100}%`,
                            backgroundColor: getPasswordStrengthColor(passwordStrength.score)
                          }}
                        ></div>
                      </div>
                      <div className="strength-label" style={{ color: getPasswordStrengthColor(passwordStrength.score) }}>
                        {getPasswordStrengthLabel(passwordStrength.score)}
                      </div>
                      <ul className="password-requirements">
                        <li className={passwordStrength.requirements.minLength ? 'met' : 'unmet'}>
                          {passwordStrength.requirements.minLength ? '✓' : '✗'} At least 8 characters
                        </li>
                        <li className={passwordStrength.requirements.hasUppercase ? 'met' : 'unmet'}>
                          {passwordStrength.requirements.hasUppercase ? '✓' : '✗'} One uppercase letter (A-Z)
                        </li>
                        <li className={passwordStrength.requirements.hasLowercase ? 'met' : 'unmet'}>
                          {passwordStrength.requirements.hasLowercase ? '✓' : '✗'} One lowercase letter (a-z)
                        </li>
                        <li className={passwordStrength.requirements.hasNumber ? 'met' : 'unmet'}>
                          {passwordStrength.requirements.hasNumber ? '✓' : '✗'} One number (0-9)
                        </li>
                        <li className={passwordStrength.requirements.hasSpecial ? 'met' : 'unmet'}>
                          {passwordStrength.requirements.hasSpecial ? '✓' : '✗'} One special character (!@#$%^&*)
                        </li>
                      </ul>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Re-enter new password"
                      className="form-input"
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={updatePassword}
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : '🔐 Update Password'}
                  </button>
                </div>

                {/* Reset Email */}
                <div className="subsection">
                  <h3>Password Reset Email</h3>
                  <p>Send a password reset email to verify your account</p>
                  <button
                    className="btn btn-secondary"
                    onClick={sendResetEmail}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : '📧 Send Reset Email'}
                  </button>
                  <small>Reset emails are sent to: abdulrahmanstd955@gmail.com</small>
                </div>
              </div>
            </div>
          )}

          {/* GROUP TAB */}
          {activeTab === 'group' && (
            <div className="tab-panel">
              <div className="section">
                <h2>👥 Group Management</h2>

                <div className="group-info">
                  <div className="info-card">
                    <div className="info-label">Group Status</div>
                    <div className="info-value">
                      {user.isGroupMode ? '✅ Active Member' : '⚠️ Not in a group'}
                    </div>
                  </div>

                  {user.groupRole && (
                    <div className="info-card">
                      <div className="info-label">Your Role</div>
                      <div className="info-value">
                        {user.groupRole === 'admin' ? '👑 Admin' : '👤 Member'}
                      </div>
                    </div>
                  )}

                  {user.joinedGroupAt && (
                    <div className="info-card">
                      <div className="info-label">Joined</div>
                      <div className="info-value">
                        {new Date(user.joinedGroupAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {user.isGroupMode && !groupData.showLeaveConfirm && (
                  <div className="subsection">
                    <h3>Leave Group</h3>
                    <p>If you want to leave this group and join or create another one, click below.</p>
                    <button
                      className="btn btn-warning"
                      onClick={() => setGroupData(prev => ({ ...prev, showLeaveConfirm: true }))}
                    >
                      👋 Leave Group
                    </button>
                  </div>
                )}

                {groupData.showLeaveConfirm && (
                  <div className="confirmation-box danger">
                    <h3>⚠️ Are you sure?</h3>
                    <p>Leaving this group means you won't see group members or their songs anymore. You can create or join another group later.</p>
                    <div className="confirmation-buttons">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setGroupData(prev => ({ ...prev, showLeaveConfirm: false }))}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={leaveGroup}
                        disabled={loading}
                      >
                        {loading ? 'Leaving...' : 'Yes, Leave Group'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === 'danger' && (
            <div className="tab-panel">
              <div className="section danger-section">
                <h2>⚠️ Danger Zone</h2>
                <p>These actions are irreversible. Please be careful.</p>

                {!deleteConfirm.confirmed ? (
                  <div className="danger-action">
                    <div className="danger-content">
                      <h3>🗑️ Delete Account</h3>
                      <p>Permanently delete your account and all associated data. This cannot be undone.</p>
                      <button
                        className="btn btn-danger"
                        onClick={() => setDeleteConfirm(prev => ({ ...prev, confirmed: true }))}
                      >
                        Delete My Account
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="confirmation-box danger">
                    <h3>🗑️ Delete Account - Final Confirmation</h3>
                    <p>This will permanently delete:</p>
                    <ul>
                      <li>Your account and profile</li>
                      <li>All songs you've added</li>
                      <li>Your account data</li>
                    </ul>
                    <p><strong>This action cannot be undone.</strong></p>
                    
                    <div className="form-group">
                      <label>Enter your password to confirm</label>
                      <input
                        type="password"
                        value={deleteConfirm.password}
                        onChange={(e) => setDeleteConfirm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your password"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={deleteConfirm.confirmed}
                          onChange={(e) => setDeleteConfirm(prev => ({ ...prev, confirmed: e.target.checked }))}
                        />
                        I understand this is permanent and cannot be undone
                      </label>
                    </div>

                    <div className="confirmation-buttons">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setDeleteConfirm({ confirmed: false, password: '' })}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={deleteAccount}
                        disabled={loading || !deleteConfirm.password}
                      >
                        {loading ? 'Deleting...' : 'Yes, Delete Forever'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="profile-footer">
          <button
            className="btn btn-secondary-outline"
            onClick={logout}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}
