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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tracks', require('./routes/tracks'));
app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT||4000;
app.listen(PORT, ()=>console.log('🎵 Purple Player server running on port', PORT));
