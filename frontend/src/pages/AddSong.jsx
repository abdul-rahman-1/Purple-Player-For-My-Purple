import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addTrack } from '../api';
import { useUser } from '../context/UserContext';
import { emitTrackAdded } from '../socket';

// Extract metadata (title & artist) from YouTube link
async function extractMetadataFromUrl(url) {
  try {
    // YouTube oEmbed API gives us title & author info
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oEmbedUrl);
      if (!response.ok) throw new Error('Failed to fetch metadata');
      const data = await response.json();

      // Example response: { title: "Song Name", author_name: "Artist", ... }
      return {
        title: data.title || 'Unknown Title',
        artist: data.author_name || 'Unknown Artist'
      };
    }

    return { title: 'Unknown Song', artist: 'Unknown Artist' };
  } catch (err) {
    console.error('Error extracting metadata:', err);
    return { title: 'Unknown Song', artist: 'Unknown Artist' };
  }
}

function getSourceFromUrl(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'direct';
}

export default function AddSong() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [source, setSource] = useState('');
  const [preview, setPreview] = useState(null);

  function handleUrlChange(e) {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError('');

    if (newUrl.trim()) {
      const src = getSourceFromUrl(newUrl);
      setSource(src);

      // Fetch metadata dynamically
      extractMetadataFromUrl(newUrl)
        .then(metadata => {
          setTitle(metadata.title);
          setArtist(metadata.artist);
        })
        .catch(err => {
          console.error('Error extracting metadata:', err);
          setTitle('Unknown Song');
          setArtist('Unknown Artist');
        });

      // Show YouTube preview
      if (src === 'youtube') {
        let videoId = '';
        if (newUrl.includes('youtu.be/')) {
          videoId = newUrl.split('youtu.be/')[1].split('?')[0];
        } else if (newUrl.includes('youtube.com/watch')) {
          videoId = new URL(newUrl).searchParams.get('v');
        }

        if (videoId) {
          setPreview({
            type: 'youtube',
            id: videoId,
            url: `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`
          });
        } else {
          setPreview(null);
        }
      } else {
        setPreview(null);
      }
    } else {
      setTitle('');
      setArtist('');
      setSource('');
      setPreview(null);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!url.trim()) {
        setError('❌ Please enter a song link');
        setLoading(false);
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setError('❌ Link must start with http:// or https://');
        setLoading(false);
        return;
      }

      if (!user || !user._id) {
        setError('❌ Please register first');
        setLoading(false);
        return;
      }

      const src = getSourceFromUrl(url);
      console.log('📤 Submitting song with source:', src);
      console.log('📝 Title:', title, 'Artist:', artist);

      const payload = {
        title: title.trim() || 'Unknown Song',
        artist: artist.trim() || 'Unknown Artist',
        source: src,
        url: url.trim(),
        message: message.trim(),
        addedBy: user._id
      };

      console.log('📦 Payload:', payload);
      const res = await addTrack(payload);
      console.log('✅ Response:', res);

      if (res.error) {
        throw new Error(res.message || res.error);
      }

      // 🔴 Emit real-time update to other group members
      if (user.groupId) {
        emitTrackAdded(user.groupId, res, user._id);
      }

      const stats = JSON.parse(localStorage.getItem('purpleStats') || '{"songs":0,"messages":0}');
      stats.songs += 1;
      if (message.trim()) stats.messages += 1;
      localStorage.setItem('purpleStats', JSON.stringify(stats));

      setSuccess(true);
      setTimeout(() => {
        navigate('/player');
      }, 2000);
    } catch (err) {
      console.error('❌ Add song error:', err);
      const errorMsg = err.message || 'Unknown error occurred';
      setError('❌ Failed to add song: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const getSourceIcon = () => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return '▶️';
    return '🔗';
  };

  return (
    <div className="page-add-song">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>

      <div className="add-song-container">
        <header className="add-song-header">
          <h1>🎵 Share a Song</h1>
          <p>Add a song to our playlist</p>
        </header>

        {success && (
          <div className="success-message">
            <span>✅</span> Song added successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={submit} className="add-song-form">
          {/* URL Input */}
          <div className="form-group">
            <label>
              <span className="icon">🔗</span>
              Song Link <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              {url && <span className="source-indicator">{getSourceIcon()}</span>}
              <input
                type="url"
                placeholder="Paste YouTube link..."
                value={url}
                onChange={handleUrlChange}
                className="input-large"
                required
              />
            </div>
            <p className="hint">Supports YouTube links (auto-detects title & artist)</p>
          </div>

          {/* YouTube Preview */}
          {preview && (
            <div className="preview-section">
              <div className="preview-label">🎵 Preview</div>
              <div className="preview-player">
                <iframe
                  src={preview.url+ "&vq=tiny"}
                  title="YouTube preview"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="preview-detected">
                <p><strong>🎵 Title:</strong> {title}</p>
                <p><strong>🎤 Artist:</strong> {artist}</p>
              </div>
            </div>
          )}

          {/* Personal Message */}
          <div className="form-group">
            <label>
              <span className="icon">💬</span>
              Personal Message <span className="optional">(optional)</span>
            </label>
            <textarea
              placeholder="Why does this song remind you of them? What does it mean to you?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-message"
              rows={4}
            />
            <p className="hint">{message.length}/200 characters</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`btn btn-primary ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner">⏳</span> Adding to playlist...
              </>
            ) : (
              <>
                <span>💜</span> Add to Our Playlist
              </>
            )}
          </button>
        </form>

        <div className="form-footer">
          <p>💡 Just paste a YouTube link — we'll detect the song automatically!</p>
        </div>
      </div>
    </div>
  );
}
