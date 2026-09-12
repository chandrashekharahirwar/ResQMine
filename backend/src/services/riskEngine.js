/**
 * ResQ Mine Risk Scoring Engine (Rule-Based & Explainable)
 * Adheres strictly to TRT.md specifications:
 * - Vibration magnitude > 1.5g: +0.3
 * - tempC > 45°C: +0.2
 * - gasPpm > 1000 ppm: +0.3
 * - waterDetected == true: +0.1
 * - roofDistanceCm drops > 15% from rolling baseline: +0.3
 * 
 * Score is capped at 1.0.
 * Status:
 *  0.0 - 0.3 -> SAFE
 *  0.3 - 0.6 -> WATCH
 *  0.6 - 1.0 -> CRITICAL
 */

const WINDOW_SIZE = 50;
const RECALC_INTERVAL = 10;

// In-memory rolling history: Map<zoneId, Map<field, { window: number[], counter: number, mean: number }>>
const rollingBaselines = new Map();

function getZoneBaseline(zoneId, field) {
  if (!rollingBaselines.has(zoneId)) {
    rollingBaselines.set(zoneId, new Map());
  }
  const zoneMap = rollingBaselines.get(zoneId);
  if (!zoneMap.has(field)) {
    zoneMap.set(field, { window: [], counter: 0, mean: null });
  }
  return zoneMap.get(field);
}

function updateRollingBaseline(zoneId, field, value) {
  if (typeof value !== 'number' || isNaN(value)) return null;

  const baseline = getZoneBaseline(zoneId, field);
  baseline.window.push(value);
  if (baseline.window.length > WINDOW_SIZE) {
    baseline.window.shift();
  }

  baseline.counter++;
  if (baseline.mean === null || baseline.counter % RECALC_INTERVAL === 0) {
    const sum = baseline.window.reduce((acc, curr) => acc + curr, 0);
    baseline.mean = baseline.window.length > 0 ? sum / baseline.window.length : value;
  }

  return baseline.mean;
}

/**
 * Calculate Euclidean vibration magnitude: sqrt(x^2 + y^2 + z^2)
 */
function calculateVibrationMagnitude(vibration) {
  if (!vibration) return 0;
  const x = Number(vibration.x) || 0;
  const y = Number(vibration.y) || 0;
  const z = Number(vibration.z) || 0;
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Evaluates a sensor reading and computes risk score, status, factor breakdown, and top factor.
 */
function evaluateReading(reading) {
  const zoneId = reading.zoneId || 'unknown';
  const contributions = {};
  const riskFactors = [];

  // 1. Vibration Magnitude
  const vibMag = calculateVibrationMagnitude(reading.vibration);
  if (vibMag > 1.5) {
    contributions.vibration = 0.3;
    riskFactors.push('vibration');
  }

  // 2. Temperature
  const temp = Number(reading.tempC);
  if (!isNaN(temp) && temp > 45) {
    contributions.tempC = 0.2;
    riskFactors.push('tempC');
  }

  // 3. Gas Concentration
  const gas = Number(reading.gasPpm);
  if (!isNaN(gas) && gas > 1000) {
    contributions.gasPpm = 0.3;
    riskFactors.push('gasPpm');
  }

  // 4. Water Ingress
  if (reading.waterDetected === true || reading.waterDetected === 'true') {
    contributions.waterDetected = 0.1;
    riskFactors.push('waterDetected');
  }

  // 5. Roof Distance Sag (% drop from rolling baseline)
  const roofDist = Number(reading.roofDistanceCm);
  let roofBaseline = null;
  if (!isNaN(roofDist) && roofDist > 0) {
    roofBaseline = updateRollingBaseline(zoneId, 'roofDistanceCm', roofDist);
    if (roofBaseline !== null && roofBaseline > 0) {
      const dropPct = (roofBaseline - roofDist) / roofBaseline;
      if (dropPct > 0.15) {
        contributions.roofDistanceCm = 0.3;
        riskFactors.push('roofDistanceCm');
      }
    }
  }

  // Calculate total score capped at 1.0
  const rawScore = Object.values(contributions).reduce((sum, val) => sum + val, 0);
  const riskScore = Math.min(1.0, parseFloat(rawScore.toFixed(2)));

  // Determine status classification
  let status = 'SAFE';
  if (riskScore >= 0.6) {
    status = 'CRITICAL';
  } else if (riskScore >= 0.3) {
    status = 'WATCH';
  }

  // Identify top contributing factor
  let topFactor = 'None';
  let maxVal = -1;
  for (const [factor, val] of Object.entries(contributions)) {
    if (val > maxVal) {
      maxVal = val;
      topFactor = factor;
    }
  }

  return {
    riskScore,
    status,
    riskFactors,
    topFactor,
    contributions,
    metrics: {
      vibrationMagnitude: parseFloat(vibMag.toFixed(3)),
      roofBaseline: roofBaseline ? parseFloat(roofBaseline.toFixed(2)) : null
    }
  };
}

/**
 * Helper to reset baseline (primarily for tests)
 */
function resetBaselines() {
  rollingBaselines.clear();
}

module.exports = {
  evaluateReading,
  calculateVibrationMagnitude,
  updateRollingBaseline,
  resetBaselines
};
