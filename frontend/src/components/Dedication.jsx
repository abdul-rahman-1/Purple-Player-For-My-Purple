import React, { useState, useEffect } from 'react';

export default function Dedication() {
  const [stats, setStats] = useState({ songs: 0, messages: 0 });

  useEffect(() => {
    // Get stats from localStorage (updated when songs are added)
    const stored = localStorage.getItem('purpleStats');
    if (stored) {
      setStats(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h3 style={{ marginTop: 0, marginBottom: 20 }}>� Your Collection</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ padding: 16, borderRadius: 8, background: 'rgba(183, 123, 255, 0.1)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{stats.songs}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Songs Shared</div>
        </div>
        <div style={{ padding: 16, borderRadius: 8, background: 'rgba(183, 123, 255, 0.1)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{stats.messages}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Messages</div>
        </div>
      </div>
      <p style={{ marginTop: 20, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
        Every song tells a story. Every message is a moment we shared. 💜
      </p>
    </div>
  );
}
