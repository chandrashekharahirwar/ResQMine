const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { getStore } = require('../config/db');
const { broadcastAlertAck } = require('../services/socketService');

/**
 * GET /api/alerts
 * Returns the alert log ordered by timestamp descending.
 */
router.get('/', async (req, res) => {
  try {
    const store = getStore();
    let alerts = [];

    if (store.isConnected()) {
      alerts = await Alert.find()
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();
    } else {
      alerts = [...store.inMemoryStore.alerts].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
    }

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    console.error('[API/alerts] Error fetching alerts:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/alerts/:id/ack
 * Control room acknowledges an alert.
 */
router.post('/:id/ack', async (req, res) => {
  try {
    const alertId = req.params.id;
    const store = getStore();
    let updated = null;

    if (store.isConnected()) {
      // Check if valid ObjectId or string
      try {
        updated = await Alert.findByIdAndUpdate(
          alertId,
          { acknowledged: true, acknowledgedAt: new Date() },
          { new: true }
        );
      } catch (e) {
        // Fallback search by string id
        updated = await Alert.findOneAndUpdate(
          { _id: alertId },
          { acknowledged: true, acknowledgedAt: new Date() },
          { new: true }
        );
      }
    }

    if (!updated) {
      // In-memory fallback
      const found = store.inMemoryStore.alerts.find(a => String(a._id) === alertId);
      if (found) {
        found.acknowledged = true;
        found.acknowledgedAt = new Date();
        updated = found;
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    // Broadcast acknowledgement to all connected dashboard clients
    broadcastAlertAck(updated);

    res.json({ success: true, message: 'Alert acknowledged', data: updated });
  } catch (err) {
    console.error('[API/alerts/:id/ack] Error acknowledging alert:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
