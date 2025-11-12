import React from 'react';

export default function TrackList({ tracks, onSelect, selectedTrack }) {
  return (
    <div className="tracklist-sidebar">
      {tracks.length === 0 ? (
        <div style={{ width: '100%', textAlign: 'center', color: 'var(--muted)', padding: '20px 16px' }}>
          <p style={{ fontSize: 13, margin: 0 }}>No songs yet...</p>
        </div>
      ) : (
        tracks.map((t) => (
          <div
            key={t._id}
            className={`track ${selectedTrack?._id === t._id ? 'active' : ''}`}
            onClick={() => onSelect(t)}
            title={`${t.title} - ${t.artist || t.addedBy?.name || 'Unknown'}\n${t.message || ''}`}
          >
            <div className="track-title">{t.title || 'Untitled'}</div>
            <div className="track-artist">{t.artist || t.addedBy?.name || 'Unknown'}</div>
          </div>
        ))
      )}
    </div>
  );
}
