require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');
const { initMQTT } = require('./config/mqtt');
const { initSocket } = require('./services/socketService');

const zoneRoutes = require('./routes/zoneRoutes');
const alertRoutes = require('./routes/alertRoutes');
const simulateRoutes = require('./routes/simulateRoutes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for easy hackathon demo access
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Request logging (concise)
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    console.log(`[HTTP] ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'ResQ Mine Safety Monitor (SIH26039)',
    timestamp: new Date().toISOString()
  });
});

// REST Routes
app.use('/api/zones', zoneRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/simulate', simulateRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[HTTP/Error]', err.stack || err.message);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

async function startServer() {
  // 1. Initialize Real-Time WebSockets
  initSocket(server, CLIENT_ORIGIN);

  // 2. Connect Database (MongoDB with In-Memory fallback)
  await connectDB();

  // 3. Connect MQTT Subscriber
  initMQTT();

  // 4. Start HTTP Server
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 ResQ Mine Backend running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io ready for live dashboard updates`);
    console.log(`📥 MQTT subscriber listening on resqmine/+/telemetry`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal bootstrap error:', err);
  process.exit(1);
});

module.exports = { app, server };
