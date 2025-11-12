import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Home() {
  const { user, logout } = useUser();
  const [stats, setStats] = useState({ songs: 0, messages: 0 });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [topSong, setTopSong] = useState(null);

  useEffect(() => {
    // Load stats from backend (actual count from database)
    async function loadStats() {
      try {
        const response = await fetch('http://localhost:4000/api/tracks');
        if (response.ok) {
          const tracks = await response.json();
          const msgCount = tracks.filter(t => t.message && t.message.trim()).length;
          setStats({
            songs: tracks.length,
            messages: msgCount
          });
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }

    loadStats();
    
    // Fetch online users from backend
    loadOnlineUsers();

    // Poll for online users every 5 seconds
    const interval = setInterval(loadOnlineUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadOnlineUsers() {
    try {
      const response = await fetch('http://localhost:4000/api/users/online');
      if (response.ok) {
        const users = await response.json();
        setOnlineUsers(users);
      }
    } catch (err) {
      console.error('Failed to load online users:', err);
    }
  }

  // Simulate top song (in production, fetch from backend)
  useEffect(() => {
    async function loadTopSong() {
      try {
        const response = await fetch('http://localhost:4000/api/tracks/top-song');
        if (response.ok) {
          const song = await response.json();
          if (song) {
            setTopSong({
              title: song.title || 'Unknown',
              artist: song.artist || 'Unknown',
              plays: 1,
              duration: '...'
            });
          }
        }
      } catch (err) {
        console.error('Failed to load top song:', err);
      }
    }
    loadTopSong();
  }, []);

  return (
    <div className="page-home">
      <div className="home-container">
        {/* Header Section */}
        <header className="home-header">
          <div className="header-content">
            <div className="logo-large">💜</div>
            <h1>Purple Player</h1>
            <p>A space where every song tells our story</p>
            {user && (
              <div className="user-greeting-section">
                <p className="user-greeting">Welcome, {user.name}! 👋</p>
                <button onClick={logout} className="btn-logout">
                  👋 Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">🎵</div>
            <div className="stat-value">{stats.songs}</div>
            <div className="stat-label">Songs Shared</div>
            <p className="stat-desc">Amazing moments captured</p>
          </div>

          <div className="stat-card secondary">
            <div className="stat-icon">💬</div>
            <div className="stat-value">{stats.messages}</div>
            <div className="stat-label">Messages</div>
            <p className="stat-desc">Words of affection</p>
          </div>

          <div className="stat-card tertiary">
            <div className="stat-icon">❤️</div>
            <div className="stat-value">100%</div>
            <div className="stat-label">Connection</div>
            <p className="stat-desc">Always here</p>
          </div>
        </section>

        {/* Now Playing */}
        {topSong && (
          <section className="now-playing">
            <h2>🏆 Most Played</h2>
            <div className="song-card-featured">
              <div className="song-artwork">🎵</div>
              <div className="song-info">
                <h3>{topSong.title}</h3>
                <p>{topSong.artist}</p>
                <div className="song-meta">
                  <span>♥️ {topSong.plays} plays</span>
                  <span>⏱️ {topSong.duration}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Online Status */}
        <section className="online-section">
          <h2>👥 Who's Here ({onlineUsers.filter(u => u.isOnline).length})</h2>
          {onlineUsers.length === 0 ? (
            <div className="no-users">
              <p>No one is here right now, but you can still add songs! 💜</p>
            </div>
          ) : (
            <div className="online-users">
              {onlineUsers.map((user, idx) => (
                <div key={idx} className={`user-card ${user.isOnline ? 'online' : 'offline'}`}>
                  <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <div className="user-status">
                      <span className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></span>
                      <span className="status-text">
                        {user.isOnline ? 'Online Now' : `Offline ${getTimeAgo(user.lastSeen)}`}
                      </span>
                    </div>
                    {user.currentlyListening && user.isOnline && (
                      <div className="listening">
                        <span>🎧 {user.currentlyListening}</span>
                      </div>
                    )}
                    <p className="last-visit">
                      {user.isOnline ? 'Active now' : `Last seen ${getTimeAgo(user.lastSeen)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <section className="action-buttons">
          <Link to="/add-song" className="btn btn-primary">
            <span>🎵</span> Add a Song
          </Link>
          <Link to="/player" className="btn btn-secondary">
            <span>▶️</span> Listen
          </Link>
        </section>
      </div>
    </div>
  );
}

function getTimeAgo(date) {
  if (!date) return 'recently';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
