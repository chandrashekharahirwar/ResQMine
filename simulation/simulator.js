require('dotenv').config();
const mqtt = require('mqtt');
const readline = require('readline');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
const PUBLISH_INTERVAL_MS = parseInt(process.env.PUBLISH_INTERVAL_MS, 10) || 3000;

const ZONES = [
  { zoneId: 'zone-1', name: 'Tunnel A - Level 2', baselineRoof: 200 },
  { zoneId: 'zone-2', name: 'Shaft 3 - Main Conveyor', baselineRoof: 210 },
  { zoneId: 'zone-3', name: 'Section B - Extraction Face', baselineRoof: 195 },
  { zoneId: 'zone-4', name: 'Ventilation Drift West', baselineRoof: 205 }
];

// Active anomaly state per zone
const activeAnomalies = new Map();

// Helper for random floats
function randomBetween(min, max, decimals = 2) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

// Generate reading for a zone
function generateZoneReading(zone) {
  const anomaly = activeAnomalies.get(zone.zoneId);

  // Normal safe readings
  let vibration = {
    x: randomBetween(0.02, 0.12, 3),
    y: randomBetween(0.02, 0.12, 3),
    z: randomBetween(0.04, 0.18, 3)
  };
  let tempC = randomBetween(24.0, 27.5, 1);
  let humidity = randomBetween(62.0, 74.0, 1);
  let waterDetected = false;
  let soundLevel = Math.round(randomBetween(42, 56, 0));
  let roofDistanceCm = randomBetween(zone.baselineRoof - 1.5, zone.baselineRoof + 1.5, 1);
  let gasPpm = Math.round(randomBetween(60, 140, 0));

  // If anomaly is active for this zone, inject hazard conditions
  if (anomaly) {
    if (anomaly.type === 'gas' || anomaly.type === 'all') {
      gasPpm = randomBetween(1350, 1680, 0); // > 1000 ppm (+0.3)
      tempC = randomBetween(47.0, 52.0, 1);   // > 45°C (+0.2)
      vibration = { x: 0.9, y: 1.1, z: 0.8 }; // mag > 1.5 (+0.3) -> 0.8 CRITICAL
    }
    if (anomaly.type === 'vibration' || anomaly.type === 'all') {
      vibration = {
        x: randomBetween(1.2, 1.6, 3),
        y: randomBetween(1.1, 1.5, 3),
        z: randomBetween(0.9, 1.4, 3)
      }; // Magnitude > 1.8g (+0.3)
      soundLevel = Math.round(randomBetween(95, 115, 0));
      gasPpm = randomBetween(1100, 1300, 0); // (+0.3) -> 0.6 CRITICAL
    }
    if (anomaly.type === 'roofSag' || anomaly.type === 'all') {
      roofDistanceCm = randomBetween(145, 160, 1); // 25% drop from ~200cm baseline (+0.3)
      vibration = { x: 1.1, y: 1.2, z: 0.8 }; // (+0.3) -> 0.6 CRITICAL
    }
    if (anomaly.type === 'water' || anomaly.type === 'all') {
      waterDetected = true; // (+0.1)
      humidity = 98.5;
      gasPpm = randomBetween(1150, 1400, 0); // (+0.3)
      vibration = { x: 1.0, y: 1.1, z: 0.8 }; // (+0.3) -> 0.7 CRITICAL
    }

    // Auto-clear anomaly after duration (default 25s) so zone recovers
    if (Date.now() > anomaly.expiresAt) {
      console.log(`\n[Simulator] Anomaly cleared for ${zone.zoneId}. Returning to SAFE baseline.\n`);
      activeAnomalies.delete(zone.zoneId);
    }
  }

  return {
    zoneId: zone.zoneId,
    timestamp: new Date().toISOString(),
    vibration,
    tempC,
    humidity,
    waterDetected,
    soundLevel,
    roofDistanceCm,
    gasPpm
  };
}

// Inject anomaly into a specific zone
function injectAnomaly(zoneId, type = 'gas', durationSec = 25) {
  activeAnomalies.set(zoneId, {
    type,
    expiresAt: Date.now() + (durationSec * 1000)
  });
  console.log(`\n⚠️  [SIMULATOR INJECTION] ${zoneId} -> Triggered '${type}' hazard for ${durationSec}s!`);
}

// Parse CLI flags: node simulator.js --anomaly zone-2 --type gas
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--anomaly') {
    const targetZone = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'zone-2';
    const typeIdx = args.indexOf('--type');
    const targetType = typeIdx !== -1 && args[typeIdx + 1] ? args[typeIdx + 1] : 'gas';
    injectAnomaly(targetZone, targetType, 30);
  }
}

const client = mqtt.connect(BROKER_URL, {
  clientId: 'resqmine-sim-' + Math.random().toString(16).substring(2, 8),
  reconnectPeriod: 3000,
  connectTimeout: 5000,
  clean: true,
  ...(process.env.MQTT_USERNAME ? { username: process.env.MQTT_USERNAME } : {}),
  ...(process.env.MQTT_PASSWORD ? { password: process.env.MQTT_PASSWORD } : {})
});

client.on('connect', () => {
  console.log(`\n=============================================================`);
  console.log(`📡 ResQ Mine Simulator connected to ${BROKER_URL}`);
  console.log(`⏱️  Publishing 4 zones every ${PUBLISH_INTERVAL_MS / 1000}s`);
  console.log(`⌨️  Interactive Commands:`);
  console.log(`   Press 'g' + Enter -> Gas leak in zone-2`);
  console.log(`   Press 'v' + Enter -> Vibration spike in zone-1`);
  console.log(`   Press 'r' + Enter -> Roof sag in zone-3`);
  console.log(`   Press 'w' + Enter -> Water ingress in zone-4`);
  console.log(`   Press 'c' + Enter -> Clear all anomalies`);
  console.log(`=============================================================\n`);

  // Start continuous publishing interval
  setInterval(() => {
    ZONES.forEach(zone => {
      const reading = generateZoneReading(zone);
      const topic = `resqmine/${zone.zoneId}/telemetry`;
      client.publish(topic, JSON.stringify(reading), { qos: 1 }, (err) => {
        if (err) {
          console.error(`[Simulator] Publish error on ${topic}:`, err.message);
        }
      });
    });

    const anomalySummary = activeAnomalies.size > 0
      ? `🚨 ACTIVE HAZARDS: ${Array.from(activeAnomalies.entries()).map(([z, a]) => `${z}(${a.type})`).join(', ')}`
      : '✅ ALL ZONES SAFE';

    console.log(`[${new Date().toLocaleTimeString()}] Published 4 zones. ${anomalySummary}`);
  }, PUBLISH_INTERVAL_MS);


});

client.on('error', (err) => {
  console.error('[Simulator] MQTT Error:', err.message);
});

client.on('reconnect', () => {
  console.log('[Simulator] Reconnecting to broker...');
});

// Interactive terminal listener if running in interactive CLI
if (process.stdin.isTTY) {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      process.exit();
    }
    switch (key.name) {
      case 'g':
        injectAnomaly('zone-2', 'gas');
        break;
      case 'v':
        injectAnomaly('zone-1', 'vibration');
        break;
      case 'r':
        injectAnomaly('zone-3', 'roofSag');
        break;
      case 'w':
        injectAnomaly('zone-4', 'water');
        break;
      case 'c':
        activeAnomalies.clear();
        console.log('\n[Simulator] Cleared all active anomalies.\n');
        break;
    }
  });
}
