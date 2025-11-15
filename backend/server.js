require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO Configuration with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(helmet());

// Increase payload size limit to handle large base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Allow all origins (CORS open to everyone)
app.use(cors());
app.options('*', cors());

// Store active connections by groupId
const groupConnections = {};

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // User joins a group room
  socket.on('join-group', (data) => {
    const { userId, groupId } = data;
    
    // Join socket to group room
    socket.join(`group-${groupId}`);
    
    // Track connections by groupId
    if (!groupConnections[groupId]) {
      groupConnections[groupId] = [];
    }
    groupConnections[groupId].push({ socketId: socket.id, userId });
    
    console.log(`✅ User ${userId} joined group ${groupId}`);
    console.log(`👥 Group ${groupId} members:`, groupConnections[groupId].length);
  });

  // Track Added - Broadcast to group
  socket.on('track:added', (data) => {
    const { groupId, track, userId } = data;
    console.log(`🎵 Track added in group ${groupId} by user ${userId}`);
    
    // Broadcast to all users in the group EXCEPT sender
    socket.to(`group-${groupId}`).emit('playlist:update', {
      event: 'track-added',
      track: track,
      addedBy: userId,
      timestamp: new Date()
    });
  });

  // Track Removed - Broadcast to group
  socket.on('track:removed', (data) => {
    const { groupId, trackId, userId } = data;
    console.log(`🗑️ Track removed in group ${groupId} by user ${userId}`);
    
    // Broadcast to all users in the group EXCEPT sender
    socket.to(`group-${groupId}`).emit('playlist:update', {
      event: 'track-removed',
      trackId: trackId,
      removedBy: userId,
      timestamp: new Date()
    });
  });

  // User disconnects
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    
    // Remove from all group connections
    for (const groupId in groupConnections) {
      groupConnections[groupId] = groupConnections[groupId].filter(
        conn => conn.socketId !== socket.id
      );
      if (groupConnections[groupId].length === 0) {
        delete groupConnections[groupId];
      }
    }
  });

  socket.on('error', (error) => {
    console.error('🚨 Socket error:', error);
  });
});

// API Key Authentication Middleware
const apiKeyMiddleware = (req, res, next) => {
  // Allow root path without API key
  if (req.path === '/') return next();
  
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validApiKey = process.env.API_KEY || 'purple-default-key-2025';
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'Missing API Key',
      message: 'Please provide API key in headers (x-api-key) or query parameter (apiKey)',
      example: 'curl -H "x-api-key: your-api-key" https://api.example.com/api/tracks'
    });
  }
  
  if (apiKey !== validApiKey) {
    return res.status(403).json({ 
      error: 'Invalid API Key',
      message: 'The provided API key is incorrect'
    });
  }
  
  next();
};

// Apply API key middleware to all /api routes
app.use('/api', apiKeyMiddleware);
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser:true, useUnifiedTopology:true }).then(async ()=>{
  console.log('✅ MongoDB Connected');
}).catch(e=>console.error('❌ MongoDB Error:', e.message));

app.get('/', (req, res) => {
  console.log('🌍 Root route accessed');
  res.send(`
    <h2>🎵 Purple Player Backend</h2>
    <p>Status: <strong>Running</strong></p>
    <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
    <p>MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Not Connected'}</p>
    <p>API Key Authentication: <strong>✅ Enabled</strong></p>
    <p>WebSocket (Socket.IO): <strong>✅ Enabled</strong></p>
    <p>Time: ${new Date().toLocaleString()}</p>
    <hr/>
    <h3>📝 API Documentation</h3>
    <p><strong>Authentication:</strong> Include API key in request headers or query parameter</p>
    <ul>
      <li><strong>Header Method:</strong> <code>x-api-key: your-api-key</code></li>
      <li><strong>Query Method:</strong> <code>?apiKey=your-api-key</code></li>
    </ul>
    <p><strong>Example:</strong></p>
    <pre>
curl -H "x-api-key: your-api-key" http://localhost:4000/api/tracks
    </pre>
  `);
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tracks', require('./routes/tracks'));
app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT||4000;
server.listen(PORT, ()=>console.log('🎵 Purple Player server running on port', PORT));

module.exports = io;
