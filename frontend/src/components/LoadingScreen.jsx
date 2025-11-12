import React, { useState } from 'react';

const quotes = [
  '💜 For My Purple',
  '💜 For my Purple',
  '💊 My human medicine',
  '🍃 My 7 mints',
  '🌸 My little blossom',
  '🎵 Every song reminds me of you',
  '✨ You are my favorite hello',
  '🌙 My midnight thought',
  'This space exists because you exist.',
  'Every song is a love letter I couldn\'t quite put into words.',
];

export default function LoadingScreen() {
  const [randomQuote] = useState(() => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="loading-logo">💜</div>
        <h1 className="loading-title">Purple Player</h1>
        
        <div className="loading-quote">
          <p>{randomQuote}</p>
        </div>

        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>

        <p className="loading-subtitle">Loading our memories...</p>
      </div>
    </div>
  );
}
