const express = require('express');
const router = express.Router();
const Zone = require('../models/Zone');
const Reading = require('../models/Reading');
const { getStore, DEFAULT_ZONES } = require('../config/db');
const { getLatestZoneState } = require('../config/mqtt');

/**
 * GET /api/zones
 * Returns all configured zones with their latest telemetry, risk score, and status.
 */
router.get('/', async (req, res) => {
  try {
    const store = getStore();
    let zones = [];

    if (store.isConnected()) {
      zones = await Zone.find().lean();
    } else {
      zones = Array.from(store.inMemoryStore.zones.values());
    }

    if (!zones || zones.length === 0) {
      zones = DEFAULT_ZONES;
    }

    const latestState = getLatestZoneState();

    const response = zones.map(z => {
      const live = latestState.get(z.zoneId) || null;
      return {
        zoneId: z.zoneId,
        name: z.name,
        latestReading: live,
        status: live ? live.status : 'SAFE',
        riskScore: live ? live.riskScore : 0.0,
        lastUpdated: live ? live.timestamp : null
      };
    });

    res.json({ success: true, count: response.length, data: response });
  } catch (err) {
    console.error('[API/zones] Error fetching zones:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/zones/:id/history?range=1h
 * Returns historical time-series data for the zone for dashboard graphs.
 */
router.get('/:id/history', async (req, res) => {
  try {
    const zoneId = req.params.id;
    const range = req.query.range || '1h';
    
    // Parse range (default 1 hour = 3600000ms)
    let rangeMs = 60 * 60 * 1000;
    if (range === '10m') rangeMs = 10 * 60 * 1000;
    if (range === '24h') rangeMs = 24 * 60 * 60 * 1000;
    
    const cutoff = new Date(Date.now() - rangeMs);
    const store = getStore();
    let readings = [];

    if (store.isConnected()) {
      readings = await Reading.find({
        zoneId,
        timestamp: { $gte: cutoff }
      })
      .sort({ timestamp: 1 })
      .limit(200)
      .lean();
    } else {
      readings = store.inMemoryStore.readings
        .filter(r => r.zoneId === zoneId && new Date(r.timestamp) >= cutoff)
        .slice(-200);
    }

    res.json({ success: true, zoneId, range, count: readings.length, data: readings });
  } catch (err) {
    console.error(`[API/zones/:id/history] Error:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
