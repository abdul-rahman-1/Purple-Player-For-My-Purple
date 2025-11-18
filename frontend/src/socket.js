import io from 'socket.io-client';

let socket = null;
let currentUserId = null;

export function initSocket(userId) {
   if (socket) return socket;

  currentUserId = userId;
  const apiUrl = import.meta.env.VITE_API_URL ;
  
  socket = io(apiUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from WebSocket');
        // Mark user offline when socket disconnects
    if (currentUserId) {
      markUserOffline(currentUserId);
    }
  });

  socket.on('error', (error) => {
    console.error('🚨 Socket error:', error);
  });

  return socket;
}

export function getSocket() {
  if (!socket) {
    return null;
  }
  return socket;
}

// Mark user offline on backend
async function markUserOffline(userId) {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const API_KEY = import.meta.env.VITE_API_KEY || 'purple-secret-key-samra-2025';
    
    await fetch(`${apiUrl}/api/users/offline/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      keepalive: true,
    });
    console.log('✅ User marked offline');
  } catch (err) {
    console.error('❌ Failed to mark user offline:', err);
  }
}
export function joinGroup(userId, groupId) {
  if (!socket) initSocket();
  socket.emit('join-group', { userId, groupId });
  console.log(`🎵 Joined group: ${groupId}`);
}

export function emitTrackAdded(groupId, track, userId) {
  if (!socket) return;
  socket.emit('track:added', { groupId, track, userId });
  console.log('📤 Emitted: Track added');
}

export function emitTrackRemoved(groupId, trackId, userId) {
  if (!socket) return;
  socket.emit('track:removed', { groupId, trackId, userId });
  console.log('📤 Emitted: Track removed');
}

export function onPlaylistUpdate(callback) {
  if (!socket) initSocket();
  socket.off('playlist:update'); // Remove old listeners
  socket.on('playlist:update', (data) => {
    console.log('📥 Received playlist update:', data);
    callback(data);
  });
}


export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
}
