const mqtt = require('mqtt');
const { evaluateReading } = require('../services/riskEngine');
const { triggerCriticalAlert } = require('../services/alertService');
const { broadcastTelemetry, broadcastAlert } = require('../services/socketService');
const Reading = require('../models/Reading');
const { getStore } = require('./db');

// Cache latest reading & status per zone for immediate REST retrieval
const latestZoneState = new Map();

/**
 * Validates the MQTT payload shape strictly per Backend-Schema.md & TRT.md.
 * Returns sanitized reading object or null if invalid.
 */
function validateReadingPayload(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.zoneId || typeof raw.zoneId !== 'string') return null;

  const vib = raw.vibration || {};
  const vibration = {
    x: typeof vib.x === 'number' ? vib.x : 0,
    y: typeof vib.y === 'number' ? vib.y : 0,
    z: typeof vib.z === 'number' ? vib.z : 0
  };

  const tempC = typeof raw.tempC === 'number' ? raw.tempC : Number(raw.tempC) || 0;
  const humidity = typeof raw.humidity === 'number' ? raw.humidity : Number(raw.humidity) || 0;
  const soundLevel = typeof raw.soundLevel === 'number' ? raw.soundLevel : Number(raw.soundLevel) || 0;
  const roofDistanceCm = typeof raw.roofDistanceCm === 'number' ? raw.roofDistanceCm : Number(raw.roofDistanceCm) || 0;
  const gasPpm = typeof raw.gasPpm === 'number' ? raw.gasPpm : Number(raw.gasPpm) || 0;
  const waterDetected = Boolean(raw.waterDetected === true || raw.waterDetected === 'true');
  const timestamp = raw.timestamp ? new Date(raw.timestamp) : new Date();

  return {
    zoneId: raw.zoneId.trim(),
    timestamp,
    vibration,
    tempC,
    humidity,
    soundLevel,
    roofDistanceCm,
    gasPpm,
    waterDetected
  };
}

/**
 * Process a validated reading: evaluate risk, save to DB, broadcast socket, trigger alert if critical.
 */
async function processReading(sanitized) {
  // 1. Evaluate risk engine
  const evalResult = evaluateReading(sanitized);

  const enrichedReading = {
    ...sanitized,
    riskScore: evalResult.riskScore,
    status: evalResult.status,
    riskFactors: evalResult.riskFactors,
    topFactor: evalResult.topFactor,
    contributions: evalResult.contributions,
    metrics: evalResult.metrics
  };

  // 2. Update in-memory latest zone state
  latestZoneState.set(sanitized.zoneId, enrichedReading);

  // 3. Emit via Socket.io sub-200ms
  broadcastTelemetry(enrichedReading);

  if (evalResult.status !== 'SAFE') {
    console.log(`[MQTT] ⚠️ ${sanitized.zoneId} status: ${evalResult.status} (Score: ${enrichedReading.riskScore}, Factors: ${enrichedReading.riskFactors.join(', ') || 'None'})`);
  }

  // 4. Fire-and-forget DB write with error logging (non-blocking)
  const store = getStore();
  if (store.isConnected()) {
    Reading.create({
      zoneId: enrichedReading.zoneId,
      timestamp: enrichedReading.timestamp,
      vibration: enrichedReading.vibration,
      tempC: enrichedReading.tempC,
      humidity: enrichedReading.humidity,
      waterDetected: enrichedReading.waterDetected,
      soundLevel: enrichedReading.soundLevel,
      roofDistanceCm: enrichedReading.roofDistanceCm,
      gasPpm: enrichedReading.gasPpm,
      riskScore: enrichedReading.riskScore,
      riskFactors: enrichedReading.riskFactors
    }).catch(err => {
      console.error(`[MQTT/DB] Failed to persist reading for ${sanitized.zoneId}:`, err.message);
    });
  } else {
    // In-memory fallback
    store.inMemoryStore.readings.push(enrichedReading);
    if (store.inMemoryStore.readings.length > 500) {
      store.inMemoryStore.readings.shift();
    }
  }

  // 5. If CRITICAL, trigger alert module
  if (evalResult.status === 'CRITICAL') {
    try {
      const alert = await triggerCriticalAlert({
        zoneId: enrichedReading.zoneId,
        riskScore: enrichedReading.riskScore,
        topFactor: enrichedReading.topFactor,
        timestamp: enrichedReading.timestamp
      });
      broadcastAlert(alert);
    } catch (err) {
      console.error(`[MQTT/Alert] Failed to trigger alert for ${sanitized.zoneId}:`, err.message);
    }
  }

  return enrichedReading;
}

let client = null;

function initMQTT() {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
  const options = {
    reconnectPeriod: 3000,
    connectTimeout: 5000,
    clean: true,
    clientId: 'resqmine-backend-' + Math.random().toString(16).substring(2, 8)
  };

  if (process.env.MQTT_USERNAME) {
    options.username = process.env.MQTT_USERNAME;
  }
  if (process.env.MQTT_PASSWORD) {
    options.password = process.env.MQTT_PASSWORD;
  }

  console.log(`[MQTT] Connecting to broker at ${brokerUrl}...`);
  client = mqtt.connect(brokerUrl, options);

  client.on('connect', () => {
    console.log('[MQTT] Connected to broker successfully.');
    // Subscribe to all zones telemetry
    client.subscribe('resqmine/+/telemetry', { qos: 1 }, (err) => {
      if (err) {
        console.error('[MQTT] Subscription error on resqmine/+/telemetry:', err.message);
      } else {
        console.log('[MQTT] Subscribed to resqmine/+/telemetry (QoS 1)');
      }
    });
  });

  client.on('message', async (topic, messageBuffer) => {
    try {
      const payloadString = messageBuffer.toString();
      const raw = JSON.parse(payloadString);
      const sanitized = validateReadingPayload(raw);

      if (!sanitized) {
        console.warn(`[MQTT] Dropping malformed payload on topic ${topic}:`, payloadString.slice(0, 100));
        return;
      }

      await processReading(sanitized);
    } catch (err) {
      console.error(`[MQTT] Error parsing message on ${topic}:`, err.message);
    }
  });

  client.on('error', (err) => {
    console.warn('[MQTT] Client error:', err.message);
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Reconnecting to broker...');
  });

  client.on('close', () => {
    // Expected on disconnect
  });

  return client;
}

function getLatestZoneState() {
  return latestZoneState;
}

module.exports = {
  initMQTT,
  processReading,
  validateReadingPayload,
  getLatestZoneState
};
