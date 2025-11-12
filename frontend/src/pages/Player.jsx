import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTracks, deleteTrack } from '../api';
import { useUser } from '../context/UserContext';

export default function Player() {
  const navigate = useNavigate();
  const { user, updateListeningStatus } = useUser();
  const [tracks, setTracks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(null);

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    // Update listening status when song is selected
    if (selected && user) {
      updateListeningStatus(selected.title, selected.artist);
    }
  }, [selected, user]);

  async function loadTracks() {
    try {
      const t = await fetchTracks();
      if (Array.isArray(t)) {
        setTracks(t);
        if (t.length > 0 && !selected) setSelected(t[0]);
      }
    } catch (err) {
      console.error('Failed to load tracks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTrack() {
    if (!selected || !user) return;
    
    const confirmed = window.confirm(`Delete "${selected.title}" by ${selected.artist}?`);
    if (!confirmed) return;

    try {
      await deleteTrack(selected._id, user._id);
      
      // Remove from list
      const updated = tracks.filter(t => t._id !== selected._id);
      setTracks(updated);
      
      // Select next track or clear
      if (updated.length > 0) {
        setSelected(updated[0]);
      } else {
        setSelected(null);
      }
    } catch (err) {
      alert('Failed to delete track. Only the person who added it can delete.');
      console.error(err);
    }
  }

  function handlePlayPause() {
    setIsPlaying(!isPlaying);
    // Only for direct audio files, NOT for YouTube
    if (selected.source === 'direct' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    // For YouTube: Use the embedded player controls!
  }

  function handlePrevious() {
    const currentIndex = filteredTracks.findIndex(t => t._id === selected?._id);
    if (currentIndex > 0) {
      setSelected(filteredTracks[currentIndex - 1]);
    }
  }

  function handleNext() {
    const currentIndex = filteredTracks.findIndex(t => t._id === selected?._id);
    if (currentIndex < filteredTracks.length - 1) {
      setSelected(filteredTracks[currentIndex + 1]);
    }
  }

  function getEmbedUrl(track) {
    if (track.source === 'youtube') {
      // Extract video ID from YouTube URL
      let videoId = '';
      if (track.url.includes('youtu.be/')) {
        videoId = track.url.split('youtu.be/')[1].split('?')[0];
      } else if (track.url.includes('youtube.com/watch')) {
        videoId = new URL(track.url).searchParams.get('v');
      }
      // Return embed URL with parameters to remove ads and autoplay
      return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&controls=1&fs=1&autoplay=1`;
    }
    return null;
  }

  const filteredTracks = tracks.filter(t => {
    if (filter === 'with-message') return t.message && t.message.trim();
    if (filter === 'youtube') return t.source === 'youtube';
    return true;
  });

  const getSourceIcon = (source) => {
    switch(source) {
      case 'youtube': return '▶️';
      default: return '🔗';
    }
  };

  return (
    <div className="page-player">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Home
      </button>

      <div className="player-layout">
        {/* Sidebar - Playlist */}
        <aside className="player-sidebar">
          <div className="sidebar-header">
            <h2>🎵 Playlist</h2>
            <span className="track-count">{filteredTracks.length}</span>
          </div>


          {/* Track List */}
          <div className="tracks-list">
            {filteredTracks.length === 0 ? (
              <div className="empty-state">
                <p>No songs in this category</p>
              </div>
            ) : (
              filteredTracks.map((track) => (
                <div
                  key={track._id}
                  className={`track-item ${selected?._id === track._id ? 'active' : ''}`}
                  onClick={() => setSelected(track)}
                >
                  <div className="track-source">{getSourceIcon(track.source)}</div>
                  <div className="track-details">
                    <div className="track-title">{track.title || 'Untitled'}</div>
                    <div className="track-artist">{track.artist || 'Unknown'}</div>
                  </div>
                  {track.message && <div className="track-has-message">💬</div>}
                </div>
              ))
            )}
          </div>

          <div className="sidebar-footer">
            <button className="btn btn-secondary" onClick={() => navigate('/add-song')}>
              <span>➕</span> Add Song
            </button>
          </div>
        </aside>

        {/* Main - Player */}
        <main className="player-main">
          {loading ? (
            <div className="loading-center">
              <div className="spinner-large">⏳</div>
              <p>Loading playlist...</p>
            </div>
          ) : selected ? (
            <div className="player-content">
              <div className="player-header">
                <h1>Now Playing</h1>
                <p>{selected.source.toUpperCase()}</p>
              </div>

              {/* Added By Card */}
              {selected.addedBy && (
                <div className="added-by-card">
                  <span className="added-by-label">💜 Shared by</span>
                  <span className="added-by-value">{selected.addedBy.name || 'Someone'}</span>
                </div>
              )}

              <div className="player-card">
                {/* Embed Player */}
                {getEmbedUrl(selected) ? (
                  <div className="player-embed">
                    {selected.source === 'youtube' && (
                      <iframe
                        width="100%"
                        height="315"
                        src={getEmbedUrl(selected)}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="album-art">🎵</div>
                    <h2>{selected.title || 'Untitled'}</h2>
                    <p>{selected.artist || 'Unknown Artist'}</p>
                  </>
                )}

                <h2 className="song-title">{selected.title || 'Untitled'}</h2>
                <p className="song-artist">{selected.artist || 'Unknown Artist'}</p>

                {selected.message && (
                  <div className="message-box-large">
                    <h3>💬 Personal Message</h3>
                    <p>{selected.message}</p>
                  </div>
                )}

                <div className="player-controls">
                  {selected.source === 'direct' && (
                    <>
                      <button className="control-btn" onClick={handlePrevious} title="Previous song">⏮️ Previous</button>
                      <button className="control-btn pause-btn" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
                        {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                      </button>
                      <button className="control-btn" onClick={handleNext} title="Next song">⏭️ Next</button>
                    </>
                  )}
                  {selected.source !== 'direct' && (
                    <p style={{ color: 'var(--muted)', fontSize: '12px' }}>
                      Use the player above to control playback
                    </p>
                  )}
                </div>

                <div className="song-info">
                  <div className="song-meta-row">
                    <span className="meta-label">🔗 Source:</span>
                    <a href={selected.url} target="_blank" rel="noreferrer" className="meta-value">{selected.source.toUpperCase()}</a>
                  </div>
                  <div className="song-meta-row">
                    <span className="meta-label">📅 Added:</span>
                    <span className="meta-value">{new Date(selected.createdAt).toLocaleDateString()}</span>
                  </div>
                  {selected.addedBy && (
                    <div className="song-meta-row added-by-highlight">
                      <span className="meta-label">👤 Shared by:</span>
                      <span className="meta-value added-by-name">{selected.addedBy.name || 'Someone'}</span>
                    </div>
                  )}
                </div>

                {/* Delete Button - Only show if user is the owner */}
                {user && selected.addedBy && (user._id === selected.addedBy._id || user._id === selected.addedBy) && (
                  <div className="song-actions">
                    <button className="btn-delete" onClick={handleDeleteTrack}>
                      🗑️ Delete Song
                    </button>
                  </div>
                )}
              </div>

              <div className="player-footer">
                <button className="btn btn-secondary" onClick={() => navigate('/add-song')}>
                  Share another song 💜
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-player">
              <div className="empty-icon">🎵</div>
              <h2>No songs yet</h2>
              <p>Add your first song to get started!</p>
              <button className="btn btn-primary" onClick={() => navigate('/add-song')}>
                Add a Song
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
