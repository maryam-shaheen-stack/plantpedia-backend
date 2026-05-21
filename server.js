const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const mongoose = require('mongoose');
const os = require('os');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// ── FIX 1 & 2: lazy DB connect with connection caching ──
// Do NOT call mongoose.connect() here at the top level.
// Vercel cold starts need the connection deferred to request time.
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);  // FIX 1: use env var
  isConnected = true;
  console.log('MongoDB connected');
};

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: os.tmpdir(),
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true
}));

// ── FIX 2: connect before every request ──────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(503).json({ success: false, message: 'Database unavailable' });
  }
});

// Routes — unchanged from your code
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/plants', require('./routes/plants'));
app.use('/api/users',  require('./routes/users'));

// Health check — enhanced to show DB status
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PlantPedia API is running!',
    timestamp: new Date(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler — unchanged
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler — unchanged
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Local dev only — Vercel never hits this branch
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`PlantPedia server running on port ${PORT}`));
}

module.exports = app;  // already present in your code — keep it