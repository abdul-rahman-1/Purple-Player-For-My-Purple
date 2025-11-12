import React, { useEffect, useRef, useState } from 'react';

export default function Player({ track }) {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (track && audioRef.current) {
      audioRef.current.src = (track.source === 'direct') ? `/api/tracks/proxy?url=${encodeURIComponent(track.url)}` : track.url;
      audioRef.current.load();
      setPlaying(false);
    }
  }, [track]);

  function toggle() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setPlaying(true);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  }

  if (!track)
    return (
      <div className="card" style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>💜</div>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Choose a song to play, and let it speak what words cannot...
        </p>
      </div>
    );

  return (
    <div className={`card ${playing ? 'player-now-playing' : ''}`}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 12,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(183,123,255,0.2), rgba(138,79,255,0.2))',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {track.cover ? (
            <img
              src={track.cover}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{ fontSize: 48, animation: playing ? 'pulseGlow 1.5s ease-in-out infinite' : 'none' }}>
              💜
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>
            {track.title || 'Untitled'}
          </h3>
          <p style={{ marginTop: 6, color: 'var(--muted)', marginBottom: 2 }}>
            {track.artist || (track.addedBy?.name || 'Unknown')}
          </p>
          {track.message && (
            <p style={{
              marginTop: 8,
              fontSize: 13,
              color: 'var(--accent)',
              fontStyle: 'italic',
              marginBottom: 8,
            }}>
              "{track.message}"
            </p>
          )}
          <div className="player-controls" style={{ marginTop: 12 }}>
            <button
              className="button"
              onClick={toggle}
              style={{
                background: playing
                  ? 'linear-gradient(90deg, #ff6b9d, #8a4fff)'
                  : 'linear-gradient(90deg, var(--accent), var(--accent-2))',
              }}
            >
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        controls
        onEnded={() => setPlaying(false)}
        style={{
          width: '100%',
          marginTop: 12,
          filter: 'brightness(0.8)',
        }}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
        Source: <span style={{ color: 'var(--accent)' }}>{track.source}</span>
      </div>
    </div>
  );
}
