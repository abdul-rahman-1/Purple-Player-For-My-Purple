require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());

// Increase payload size limit to handle large base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Allow all origins (CORS open to everyone)
app.use(cors());
app.options('*', cors());

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
app.listen(PORT, ()=>console.log('🎵 Purple Player server running on port', PORT));
