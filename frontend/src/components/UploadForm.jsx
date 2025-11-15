import React, { useState } from 'react';
import { addTrack } from '../api';
import { useUser } from '../context/UserContext';

// Auto-detect YouTube video metadata using noembed API (no API key needed)
async function getYouTubeMetadata(videoId) {
  try {
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    const data = await response.json();
    
    if (data && data.title) {
      let title = data.title;
      let artist = 'Unknown Artist';
      
      // Parse title formats: "Artist - Song", "Artist | Song"
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length === 2) {
          artist = parts[0].trim();
          title = parts[1].trim();
        }
      } else if (title.includes(' | ')) {
        const parts = title.split(' | ');
        if (parts.length === 2) {
          artist = parts[0].trim();
          title = parts[1].trim();
        }
      }
      
      console.log('✅ YouTube metadata detected - Title:', title, 'Artist:', artist);
      return { title, artist };
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch YouTube metadata:', err.message);
  }
  
  return null;
}

export default function UploadForm({ onAdded }) {
  const { user } = useUser();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(false);

  async function handleUrlChange(e) {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError('');
    
    // Check if it's a YouTube URL
    const isYouTube = newUrl.includes('youtube.com') || newUrl.includes('youtu.be');
    
    if (newUrl.trim() && !isYouTube && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
      setError('❌ Only YouTube links are supported. Please paste a YouTube URL.');
      setTitle('');
      setArtist('');
      return;
    }
    
    if (isYouTube) {
      setDetecting(true);
      let videoId = '';
      
      // Extract video ID from YouTube URL
      if (newUrl.includes('youtu.be/')) {
        videoId = newUrl.split('youtu.be/')[1].split('?')[0];
      } else if (newUrl.includes('youtube.com/watch')) {
        videoId = new URL(newUrl).searchParams.get('v');
      }
      
      if (videoId) {
        console.log('🎥 YouTube video ID detected:', videoId);
        const metadata = await getYouTubeMetadata(videoId);
        
        if (metadata) {
          setTitle(metadata.title);
          setArtist(metadata.artist);
        } else {
          setTitle('YouTube Video');
          setArtist('Unknown');
        }
      }
      setDetecting(false);
    } else {
      setTitle('');
      setArtist('');
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate user is logged in
      if (!user || !user._id) {
        setError('❌ Please register first before adding songs');
        setLoading(false);
        return;
      }

      // Validate URL
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

      // Validate YouTube URL only
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        setError('❌ Only YouTube links are supported. Please paste a YouTube URL.');
        setLoading(false);
        return;
      }

      // Validate title and artist are provided
      if (!title.trim()) {
        setError('❌ Please enter a song title');
        setLoading(false);
        return;
      }

      if (!artist.trim()) {
        setError('❌ Please enter the artist name');
        setLoading(false);
        return;
      }
      
      const payload = { 
        title: title.trim(), 
        artist: artist.trim(), 
        source: 'youtube', 
        url: url.trim(), 
        message: message.trim(),
        addedBy: user._id  // CRITICAL: Include user ID
      };

      console.log('📤 Submitting track:', payload);
      const res = await addTrack(payload);
      
      if (res.error) {
        throw new Error(res.message || res.error || 'Failed to add track');
      }
      
      // Update stats
      const stats = JSON.parse(localStorage.getItem('purpleStats') || '{"songs":0,"messages":0}');
      stats.songs += 1;
      if (message.trim()) stats.messages += 1;
      localStorage.setItem('purpleStats', JSON.stringify(stats));
      
      setUrl('');
      setTitle('');
      setArtist('');
      setMessage('');
      if (onAdded) onAdded(res);
    } catch (err) {
      const errorMsg = err.message || 'Failed to add song. Please try again.';
      setError('❌ ' + errorMsg);
      console.error('❌ Add song error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="upload-form-wrapper">
      <div className="upload-form-header">
        <h3>🎵 Share A Song</h3>
        <p>Paste a YouTube link and we'll detect the title and artist</p>
      </div>

      {error && (
        <div className="upload-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="upload-form-content">
        {/* Main URL Input */}
        <div className="form-group-large">
          <label>
            <span className="label-icon">🔗</span>
            Song Link <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            {detecting && <span className="source-indicator">⏳</span>}
            <input
              type="url"
              placeholder="Paste YouTube link..."
              value={url}
              onChange={handleUrlChange}
              className="url-input"
              required
            />
          </div>
          <p className="field-hint">YouTube only • We'll auto-detect title & artist</p>
        </div>

        {/* Optional Fields Row */}
        <div className="optional-fields-row">
          <div className="form-group-half">
            <label>
              <span className="label-icon">🎬</span>
              Title <span className="optional-label">(auto-detected)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Blinding Lights"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="optional-input"
            />
          </div>
          <div className="form-group-half">
            <label>
              <span className="label-icon">🎤</span>
              Artist <span className="optional-label">(auto-detected)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., The Weeknd"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="optional-input"
            />
          </div>
        </div>

        {/* Message */}
        <div className="form-group-large">
          <label>
            <span className="label-icon">💬</span>
            Personal Message <span className="optional-label">(tell them why)</span>
          </label>
          <textarea
            placeholder="Why does this song remind you of them? What does it mean to you?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="message-textarea"
            rows={3}
          />
          <p className="field-hint">{message.length}/200 characters</p>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className={`upload-submit ${loading ? 'loading' : ''}`}
          disabled={loading || detecting}
        >
          {loading ? (
            <>
              <span className="spinner-small">⏳</span>
              Adding to playlist...
            </>
          ) : (
            <>
              <span>💜</span>
              Add to Our Playlist
            </>
          )}
        </button>
      </div>
    </form>
  );
}
