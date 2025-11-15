import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();
const API_KEY = import.meta.env.VITE_API_KEY || 'purple-secret-key-samra-2025';

// Helper to add API key to headers
function getHeaders(additionalHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...additionalHeaders
  };
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in localStorage
    const storedUser = localStorage.getItem('purpleUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      // Send heartbeat to server
      heartbeat(userData._id);
      // Start heartbeat interval to keep user online
      startHeartbeat(userData._id);
      
      // Refresh user data from server to ensure groupId is fresh
      refreshUserData(userData._id).then(freshData => {
        if (freshData) {
          setUser(freshData);
          localStorage.setItem('purpleUser', JSON.stringify(freshData));
        }
      }).catch(err => console.log('Could not refresh user data:', err.message));
    }
    setLoading(false);

    // Handle page unload (closing browser/tab)
    const handleBeforeUnload = async () => {
      const user = JSON.parse(localStorage.getItem('purpleUser'));
      if (user) {
        try {
          await fetch(import.meta.env.VITE_API_URL+`/api/users/offline/${user._id}`, {
            method: 'PUT',
            headers: getHeaders(),
            keepalive: true
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
        await fetch(import.meta.env.VITE_API_URL+`/api/users/heartbeat/${userId}`, {
          method: 'POST',
          headers: getHeaders()
        });
      }
    } catch (err) {
      console.error('Heartbeat error:', err);
    }
  }

  async function refreshUserData(userId) {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/users/${userId}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        console.warn('Could not refresh user data from server');
        return null;
      }

      const freshData = await response.json();
      console.log('✅ User data refreshed from server:', { 
        groupId: freshData.groupId, 
        groupRole: freshData.groupRole 
      });
      return freshData;
    } catch (err) {
      console.warn('Error refreshing user data:', err.message);
      return null;
    }
  }

  async function registerUser(name, email, password, avatar = null) {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/users/register', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password, avatar })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

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

  async function loginUser(email, password) {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/users/login', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const userData = await response.json();
      
      // Fetch fresh user data from server to ensure groupId is present
      const freshUserResponse = await fetch(import.meta.env.VITE_API_URL + `/api/users/${userData._id}`, {
        method: 'GET',
        headers: getHeaders()
      });
      
      let freshUserData = userData;
      if (freshUserResponse.ok) {
        freshUserData = await freshUserResponse.json();
        console.log('✅ Fresh user data loaded with groupId:', freshUserData.groupId);
      }
      
      setUser(freshUserData);
      localStorage.setItem('purpleUser', JSON.stringify(freshUserData));
      
      // Start heartbeat interval
      startHeartbeat(freshUserData._id);
      
      return freshUserData;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }

  async function generateGroupCode(userId) {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/users/generate-group-code/${userId}`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to generate group code');

      return await response.json();
    } catch (err) {
      console.error('Generate code error:', err);
      throw err;
    }
  }

  async function createGroup(userId, groupName) {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/users/join-group/${userId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          createNew: true,
          groupName: groupName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create group');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('purpleUser', JSON.stringify(userData));
      
      return userData;
    } catch (err) {
      console.error('Create group error:', err);
      throw err;
    }
  }

  async function joinGroup(userId, groupCode) {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/users/join-group/${userId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          createNew: false,
          groupCode: groupCode 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join group');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('purpleUser', JSON.stringify(userData));
      
      return userData;
    } catch (err) {
      console.error('Join group error:', err);
      throw err;
    }
  }

  async function getGroupMembers(userId) {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/users/group/members/${userId}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch group members');
      }

      return await response.json();
    } catch (err) {
      console.error('Get group members error:', err);
      throw err;
    }
  }

  async function getGroupTracks(userId) {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/tracks/group/shared/${userId}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch group tracks');
      }

      return await response.json();
    } catch (err) {
      console.error('Get group tracks error:', err);
      throw err;
    }
  }

  async function getMemberTrackCount(memberId) {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/tracks/user/${memberId}/count`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch track count');

      return await response.json();
    } catch (err) {
      console.error('Get member track count error:', err);
      throw err;
    }
  }

  async function leaveGroup(userId) {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/users/leave-group/${userId}`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to leave group');

      const updatedUser = { ...user, isGroupMode: false, groupMemberId: null, groupCode: null };
      setUser(updatedUser);
      localStorage.setItem('purpleUser', JSON.stringify(updatedUser));
      
      return await response.json();
    } catch (err) {
      console.error('Leave group error:', err);
      throw err;
    }
  }

  async function updateListeningStatus(songTitle, songArtist) {
    if (!user) return;
    try {
      const response = await fetch(import.meta.env.VITE_API_URL+`/api/users/listening/${user._id}`, {
        method: 'PUT',
        headers: getHeaders(),
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

  async function logout() {
    if (user) {
      try {
        await fetch(import.meta.env.VITE_API_URL+`/api/users/offline/${user._id}`, {
          method: 'PUT',
          headers: getHeaders()
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
    <UserContext.Provider value={{ user, loading, registerUser, loginUser, createGroup, generateGroupCode, joinGroup, leaveGroup, getGroupMembers, getGroupTracks, getMemberTrackCount, updateListeningStatus, logout }}>
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
