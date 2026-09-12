const mongoose = require('mongoose');
const Zone = require('../models/Zone');

const DEFAULT_ZONES = [
  { zoneId: 'zone-1', name: 'Tunnel A - Level 2' },
  { zoneId: 'zone-2', name: 'Shaft 3 - Main Conveyor' },
  { zoneId: 'zone-3', name: 'Section B - Extraction Face' },
  { zoneId: 'zone-4', name: 'Ventilation Drift West' }
];

let isConnected = false;

// In-memory mock fallback store in case MongoDB is not currently running
const inMemoryStore = {
  zones: new Map(),
  readings: [],
  alerts: []
};

// Seed in-memory store
DEFAULT_ZONES.forEach(z => {
  inMemoryStore.zones.set(z.zoneId, {
    _id: 'mock-zone-' + z.zoneId,
    ...z,
    createdAt: new Date()
  });
});

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resqmine';

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[Database] Connected to MongoDB at ${uri.replace(/\/\/.*@/, '//***@')}`);

    // Seed default zones if empty
    for (const z of DEFAULT_ZONES) {
      await Zone.findOneAndUpdate(
        { zoneId: z.zoneId },
        { $setOnInsert: { ...z, createdAt: new Date() } },
        { upsert: true, new: true }
      );
    }
    console.log('[Database] Default zones verified in MongoDB.');
  } catch (err) {
    console.warn(`[Database] Could not connect to MongoDB (${err.message}).`);
    console.warn('[Database] Activated In-Memory Storage Fallback so you can run and test everything smoothly without needing a local MongoDB daemon!');
    console.warn('[Database] To use real MongoDB, provide a working Atlas MONGODB_URI in backend/.env.');
    isConnected = false;
  }
}

function getStore() {
  return {
    isConnected: () => isConnected,
    inMemoryStore
  };
}

module.exports = {
  connectDB,
  getStore,
  DEFAULT_ZONES
};
