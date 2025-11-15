import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";

const API_KEY = import.meta.env.VITE_API_KEY || 'purple-secret-key-samra-2025';

// Helper to add API key to headers
function getHeaders(additionalHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...additionalHeaders
  };
}

export default function Home() {
  const { user, logout, getGroupMembers, getGroupTracks } = useUser();
  const [stats, setStats] = useState({ songs: 0, messages: 0 });
  const [groupMembers, setGroupMembers] = useState([]);
  const [topSong, setTopSong] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const previousMembersRef = useRef([]);

  useEffect(() => {
    // Load stats based on user mode
    loadStats();
    
    // If user is in a group, load group members
    if (user && user.isGroupMode && user.groupId) {
      loadGroupMembers();
      // Poll for group members every 5 seconds (only if data changed)
      const interval = setInterval(loadGroupMembers, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  async function loadStats() {
    try {
      if (user && user.isGroupMode && user.groupId) {
        // Load only group tracks
        const groupData = await getGroupTracks(user._id);
        const msgCount = groupData.tracks.filter(
          (t) => t.message && t.message.trim()
        ).length;
        setStats({
          songs: groupData.tracksCount || 0,
          messages: msgCount,
        });
      } else {
        // Solo user - load all tracks (or could load only their own)
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/tracks",
          { headers: getHeaders() }
        );
        if (response.ok) {
          const tracks = await response.json();
          const msgCount = tracks.filter(
            (t) => t.message && t.message.trim()
          ).length;
          setStats({
            songs: tracks.length,
            messages: msgCount,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }

  async function loadGroupMembers() {
    if (!user || !user.isGroupMode || !user.groupId) return;
    
    // Only show loading state on initial load, not on polling refreshes
    if (isInitialLoad) {
      setLoading(false);
    }
    
    try {
      const data = await getGroupMembers(user._id);
      
      // Only update if members actually changed (prevent flickering)
      const membersStr = JSON.stringify(data.members || []);
      const prevStr = JSON.stringify(previousMembersRef.current);
      
      if (membersStr !== prevStr) {
        setGroupMembers(data.members || []);
        previousMembersRef.current = data.members || [];
      }
      
      // Mark initial load as done after first successful fetch
      if (isInitialLoad) {
        setIsInitialLoad(false);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load group members:", err);
      // Only update loading state on initial load
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }

  // Fetch top song
  useEffect(() => {
    async function loadTopSong() {
      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/tracks/top-song",
          { headers: getHeaders() }
        );
        if (response.ok) {
          const song = await response.json();
          if (song) {
            setTopSong({
              title: song.title || "Unknown",
              artist: song.artist || "Unknown",
              plays: 1,
              duration: "...",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load top song:", err);
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
                <p className="user-greeting">
                  Welcome, {user.name}! 👋
                  {user.isGroupMode && user.groupRole === 'admin' && (
                    <span className="badge-admin"> (Group Admin)</span>
                  )}
                </p>
                <button onClick={logout} className="btn-logout">
                  👋 Sign Out
                </button>
              </div>
            )}
          </div>
        </header>
        {/* Footer Section */}
        <footer className="home-footer row my-5 footer-bg">
          <div
            className="col-md-3"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              style={{ width: "100%", borderRadius: "15px" }}
              src="/logo.png"
              alt="Purple Player Logo"
            />
          </div>
          <div className="footer-content col-md-9">
            <h3>About Purple Player</h3>
            <p>
              A Friendly, ad-free music-sharing app where every song tells a
              story. A digital love letter where you and someone special can
              share your favorite songs with personal messages.
            </p>

            <div className="footer-creators text-center">
              <h4>Made by</h4>
              <p>
                <a
                  href="https://github.com/abdul-rahman-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="creator-link"
                >
                  Abdul Rahman
                </a>{" "}
                for his purple 💜
              </p>
              <p>
                <a
                  href="https://github.com/1-Samra-Khan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="creator-link"
                >
                  Samra Khan
                </a>
              </p>
            </div>

            <div className="footer-tech text-center">
              <p>
                Built with React + Vite (Frontend) • Express + MongoDB (Backend)
              </p>
              <p>
                YouTube-based music sharing • No Ads • No Distractions • Just
                Music & Love 💜
              </p>
            </div>
          </div>
        </footer>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">🎵</div>
            <div className="stat-value">{stats.songs}</div>
            <div className="stat-label">
              {user && user.isGroupMode ? "Group Songs" : "Songs Shared"}
            </div>
            <p className="stat-desc">
              {user && user.isGroupMode ? "In your group" : "Amazing moments captured"}
            </p>
          </div>

          <div className="stat-card secondary">
            <div className="stat-icon">💬</div>
            <div className="stat-value">{stats.messages}</div>
            <div className="stat-label">Messages</div>
            <p className="stat-desc">Words of affection</p>
          </div>

          <div className="stat-card tertiary">
            <div className="stat-icon">❤️</div>
            <div className="stat-value">{user && user.isGroupMode ? groupMembers.length : "100%"}</div>
            <div className="stat-label">{user && user.isGroupMode ? "Members" : "Connection"}</div>
            <p className="stat-desc">{user && user.isGroupMode ? "In your group" : "Always here"}</p>
          </div>
        </section>

        {/* Now Playing */}
        {topSong && (
          <section className="now-playing row"
          style={{display:"flex",justifyContent:"center"}}>
            <h2 className="col-md-12">🏆 Most Played</h2>
            <div className="song-card-featured col-md-6">
              <div className="song-artwork">🎵</div>
              <div className="song-info">
                <h3>
                  {topSong.title.length > 25
                    ? topSong.title.slice(0, 25) + "..."
                    : topSong.title}
                </h3>
                <p>{topSong.artist}</p>
                <div className="song-meta">
                  <span>♥️ {topSong.plays} plays</span>
                  <span>⏱️ {topSong.duration}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Online Status - Only show for group users */}
        {user && user.isGroupMode && (
          <section className="online-section fade-in">
            <h2>
              👥 Group Members ({groupMembers.filter((m) => m.isOnline).length}/{groupMembers.length})
            </h2>
            {loading ? (
              <p>Loading group members...</p>
            ) : groupMembers.length === 0 ? (
              <div className="no-users">
                <p>No other members in your group yet. Invite them to join! 💜</p>
              </div>
            ) : (
              <div className="online-users">
                {groupMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className={`user-card ${
                      member.isOnline ? "online" : "offline"
                    }`}
                  >
                    <div className="user-avatar">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="avatar-image" />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="user-info">
                      <h3>
                        {member.name}
                        {member.role === 'admin' && (
                          <span className="badge-role"> 👑 Admin</span>
                        )}
                      </h3>
                      <div className="user-status">
                        <span
                          className={`status-dot ${
                            member.isOnline ? "online" : "offline"
                          }`}
                        ></span>
                        <span className="status-text">
                          {member.isOnline
                            ? "Online Now"
                            : `Offline ${getTimeAgo(member.lastSeen)}`}
                        </span>
                      </div>
                      {member.currentlyListening && member.isOnline && (
                        <div className="listening">
                          <span>🎧 {member.currentlyListening}</span>
                        </div>
                      )}
                      <p className="last-visit">
                        {member.isOnline
                          ? "Active now"
                          : `Last seen ${getTimeAgo(member.lastSeen)}`}
                      </p>
                      <p className="member-since">
                        Joined {getTimeAgo(member.joinedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Solo User Info */}
        {user && !user.isGroupMode && (
          <section className="solo-section">
            <div className="solo-card">
              <h2>🎵 Solo Mode</h2>
              <p>You're currently in solo mode. Your songs are visible only to you.</p>
              <p className="hint">Want to share music with someone? Go to Add Song to create or join a group!</p>
            </div>
          </section>
        )}

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
  if (!date) return "recently";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
