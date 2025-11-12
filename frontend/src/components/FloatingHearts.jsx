import React, { useEffect } from 'react';

export default function FloatingHearts() {
  useEffect(() => {
    const interval = setInterval(() => {
      const heart = document.createElement('div');
      heart.className = 'floating-heart';
      heart.textContent = '💜';
      heart.style.left = Math.random() * window.innerWidth + 'px';
      heart.style.top = window.innerHeight + 'px';
      document.body.appendChild(heart);
      
      setTimeout(() => heart.remove(), 2000);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return null;
}
