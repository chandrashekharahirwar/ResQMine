const Alert = require('../models/Alert');
const { getStore } = require('../config/db');

// In-memory rate limiting: Map<zoneId, lastSmsSentTimestamp>
const lastSmsSentMap = new Map();
const FIVE_MINUTES_MS = 5 * 60 * 1000;

// Twilio Client setup (optional)
let twilioClient = null;
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  CONTROL_ROOM_PHONE_NUMBER
} = process.env;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('[AlertService] Twilio SMS client initialized.');
  } catch (err) {
    console.warn('[AlertService] Failed to initialize Twilio client:', err.message);
  }
} else {
  console.log('[AlertService] Twilio credentials not configured. Running in Mock SMS mode.');
}

/**
 * Checks if SMS can be sent for the zone based on 5-minute rate limit.
 */
function canSendSms(zoneId) {
  const now = Date.now();
  const lastSent = lastSmsSentMap.get(zoneId);
  if (!lastSent || (now - lastSent >= FIVE_MINUTES_MS)) {
    return true;
  }
  return false;
}

/**
 * Creates an alert in DB / store and dispatches Twilio SMS if rate limit allows.
 */
async function triggerCriticalAlert({ zoneId, riskScore, topFactor, timestamp }) {
  const alertTime = timestamp ? new Date(timestamp) : new Date();
  const topContributingFactor = topFactor || 'Unknown';
  
  // Format message according to TRT.md:
  // "ResQ Mine ALERT: Zone {zoneId} CRITICAL ({riskScore}). Cause: {topContributingFactor}. Time: {timestamp}"
  const messageBody = `ResQ Mine ALERT: Zone ${zoneId} CRITICAL (${riskScore}). Cause: ${topContributingFactor}. Time: ${alertTime.toISOString()}`;

  let smsSent = false;
  const eligibleForSms = canSendSms(zoneId);

  if (eligibleForSms) {
    if (twilioClient && CONTROL_ROOM_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: messageBody,
          from: TWILIO_PHONE_NUMBER,
          to: CONTROL_ROOM_PHONE_NUMBER
        });
        smsSent = true;
        lastSmsSentMap.set(zoneId, Date.now());
        console.log(`[AlertService] [Twilio SMS Sent] -> ${CONTROL_ROOM_PHONE_NUMBER}: ${messageBody}`);
      } catch (err) {
        console.error(`[AlertService] Twilio error: ${err.message}`);
      }
    } else {
      // Mock SMS mode: output clearly for demo
      smsSent = true;
      lastSmsSentMap.set(zoneId, Date.now());
      console.log(`\n========================================`);
      console.log(`🚨 [MOCK SMS DISPATCHED] (Rate limit: 1 per zone / 5min)`);
      console.log(`To: ${CONTROL_ROOM_PHONE_NUMBER || '+91-CONTROL-ROOM'}`);
      console.log(`Message: ${messageBody}`);
      console.log(`========================================\n`);
    }
  } else {
    const nextAllowedInSec = Math.round((FIVE_MINUTES_MS - (Date.now() - lastSmsSentMap.get(zoneId))) / 1000);
    console.log(`[AlertService] SMS throttled for ${zoneId} (Rate limit active, next SMS allowed in ${nextAllowedInSec}s).`);
  }

  // Persist alert in MongoDB or in-memory fallback
  const store = getStore();
  let savedAlert = null;

  if (store.isConnected()) {
    try {
      savedAlert = await Alert.create({
        zoneId,
        riskScore,
        topFactor: topContributingFactor,
        timestamp: alertTime,
        smsSent,
        acknowledged: false,
        acknowledgedAt: null
      });
    } catch (err) {
      console.error('[AlertService] Error saving alert to MongoDB:', err.message);
    }
  }

  if (!savedAlert) {
    savedAlert = {
      _id: 'mock-alert-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      zoneId,
      riskScore,
      topFactor: topContributingFactor,
      timestamp: alertTime,
      smsSent,
      acknowledged: false,
      acknowledgedAt: null
    };
    store.inMemoryStore.alerts.unshift(savedAlert);
    if (store.inMemoryStore.alerts.length > 200) {
      store.inMemoryStore.alerts.pop();
    }
  }

  return savedAlert;
}

module.exports = {
  triggerCriticalAlert,
  canSendSms,
  lastSmsSentMap
};
