const express = require('express');
const router = express.Router();
const { processReading } = require('../config/mqtt');

/**
 * POST /api/simulate/anomaly
 * Demo-only: force an anomaly into a chosen zone.
 * Supported types: 'gas', 'vibration', 'roofSag', 'water', 'combined'
 */
router.post('/anomaly', async (req, res) => {
  try {
    const { zoneId = 'zone-2', type = 'gas', customValue } = req.body;

    // Standard safe baseline readings
    const reading = {
      zoneId,
      timestamp: new Date().toISOString(),
      vibration: { x: 0.08, y: 0.05, z: 0.12 },
      tempC: 26.5,
      humidity: 68.0,
      waterDetected: false,
      soundLevel: 45,
      roofDistanceCm: 200,
      gasPpm: 120
    };

    // Inject specific hazard condition
    switch (type) {
      case 'gas':
        // Gas PPM > 1000 (+0.3) & slightly high temp (+0.2) or massive gas to guarantee critical
        reading.gasPpm = customValue || 1450;
        reading.tempC = 48.2; // +0.2 temp -> total 0.5 or 0.6+
        reading.vibration = { x: 0.9, y: 1.1, z: 0.8 }; // mag = 1.62 > 1.5 -> +0.3 -> total 0.8 CRITICAL
        break;

      case 'vibration':
        // Vibration > 1.5g (+0.3)
        reading.vibration = { x: 1.2, y: 1.5, z: 0.9 }; // magnitude = 2.12g > 1.5g (+0.3)
        reading.gasPpm = 1100; // +0.3 -> total 0.6 CRITICAL
        break;

      case 'roofSag':
        // Roof sag: drop > 15% from 200cm baseline (< 170cm)
        reading.roofDistanceCm = 150; // 25% drop (+0.3)
        reading.vibration = { x: 1.1, y: 1.0, z: 0.8 }; // magnitude = 1.69 > 1.5 (+0.3) -> total 0.6 CRITICAL
        break;

      case 'water':
        // Water ingress (+0.1) combined with vibration (+0.3) & gas (+0.3)
        reading.waterDetected = true;
        reading.gasPpm = 1250;
        reading.vibration = { x: 1.0, y: 1.1, z: 0.7 };
        break;

      case 'combined':
      default:
        reading.gasPpm = 1600;
        reading.tempC = 52.0;
        reading.waterDetected = true;
        reading.vibration = { x: 1.4, y: 1.6, z: 1.2 };
        reading.roofDistanceCm = 140;
        break;
    }

    const processed = await processReading(reading);

    res.json({
      success: true,
      message: `Anomaly (${type}) injected into ${zoneId}`,
      reading: processed
    });
  } catch (err) {
    console.error('[API/simulate/anomaly] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
