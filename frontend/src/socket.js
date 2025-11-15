import io from 'socket.io-client';

let socket = null;

export function initSocket() {
  if (socket) return socket;

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
  });

  socket.on('error', (error) => {
    console.error('🚨 Socket error:', error);
  });

  return socket;
}

export function getSocket() {
  if (!socket) {
    return initSocket();
  }
  return socket;
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
  }
}
