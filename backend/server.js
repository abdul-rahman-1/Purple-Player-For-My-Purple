require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS).split(',') }));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser:true, useUnifiedTopology:true }).then(()=>console.log('✅ MongoDB Connected')).catch(e=>console.error('❌ MongoDB Error:', e.message));

app.get('/', (req, res) => {
  console.log('🌍 Root route accessed');
  res.send(`
    <h2>🎵 Purple Player Backend</h2>
    <p>Status: <strong>Running</strong></p>
    <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
    <p>MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Not Connected'}</p>
    <p>Allowed Origins: ${process.env.ALLOWED_ORIGINS || 'None'}</p>
    <p>Time: ${new Date().toLocaleString()}</p>
  `);
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tracks', require('./routes/tracks'));
app.use('/api/users', require('./routes/users'));
app.use((req, res) => {
  console.warn(`⚠️ 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`
====================================
🚀 Purple Player Server Started
🌐 PORT: ${PORT}
📦 MongoDB: ${process.env.MONGODB_URI ? 'Configured' : 'Not Set'}
====================================
  `);
});
const PORT = process.env.PORT||4000;
app.listen(PORT, ()=>console.log('🎵 Purple Player server running on port', PORT));
