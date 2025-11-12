import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in cookies/localStorage
    const storedUser = localStorage.getItem('purpleUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      // Send heartbeat to server
      heartbeat(userData._id);
      // Start heartbeat interval to keep user online
      startHeartbeat(userData._id);
    } else {
      // First visit - show registration modal
      setLoading(false);
    }

    // Handle page unload (closing browser/tab)
    const handleBeforeUnload = async () => {
      const user = JSON.parse(localStorage.getItem('purpleUser'));
      if (user) {
        // Send offline signal immediately
        try {
          await fetch(`http://localhost:4000/api/users/offline/${user._id}`, {
            method: 'PUT',
            keepalive: true // Important for unload
          });
        } catch (err) {
          console.error('Offline error on unload:', err);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  async function heartbeat(userId) {
    try {
      if (userId) {
        await fetch(`http://localhost:4000/api/users/heartbeat/${userId}`, {
          method: 'POST'
        });
      }
    } catch (err) {
      console.error('Heartbeat error:', err);
    }
  }

  async function registerUser(name, email) {
    try {
      const sessionId = generateSessionId();
      const response = await fetch('http://localhost:4000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, sessionId })
      });

      if (!response.ok) throw new Error('Registration failed');

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('purpleUser', JSON.stringify(userData));
      
      // Start heartbeat interval
      startHeartbeat(userData._id);
      
      return userData;
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  }

  async function updateListeningStatus(songTitle, songArtist) {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:4000/api/users/listening/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songTitle, songArtist })
      });
      const updated = await response.json();
      setUser(updated);
      localStorage.setItem('purpleUser', JSON.stringify(updated));
    } catch (err) {
      console.error('Update listening error:', err);
    }
  }

  function startHeartbeat(userId) {
    // Send heartbeat every 30 seconds to keep user online
    const heartbeatInterval = setInterval(() => {
      heartbeat(userId);
    }, 30000);
    
    // Store interval ID for cleanup
    window.heartbeatInterval = heartbeatInterval;
  }

  function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async function logout() {
    if (user) {
      try {
        await fetch(`http://localhost:4000/api/users/offline/${user._id}`, {
          method: 'PUT'
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    // Clear heartbeat interval
    if (window.heartbeatInterval) {
      clearInterval(window.heartbeatInterval);
    }
    setUser(null);
    localStorage.removeItem('purpleUser');
  }

  return (
    <UserContext.Provider value={{ user, loading, registerUser, updateListeningStatus, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
