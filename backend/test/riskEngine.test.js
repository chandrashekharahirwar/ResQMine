const assert = require('assert');
const { evaluateReading, resetBaselines } = require('../src/services/riskEngine');
const { canSendSms, lastSmsSentMap } = require('../src/services/alertService');

console.log('🧪 Running ResQ Mine Risk Engine & Alert Unit Tests...\n');

resetBaselines();

// Test 1: Baseline safe reading
{
  const reading = {
    zoneId: 'zone-1',
    vibration: { x: 0.1, y: 0.1, z: 0.1 },
    tempC: 25,
    gasPpm: 100,
    waterDetected: false,
    roofDistanceCm: 200
  };

  const result = evaluateReading(reading);
  console.log('Test 1 (Safe baseline):', result.riskScore, result.status);
  assert.strictEqual(result.riskScore, 0.0);
  assert.strictEqual(result.status, 'SAFE');
  assert.strictEqual(result.riskFactors.length, 0);
}

// Test 2: Gas Breach (gasPpm > 1000 -> +0.3 -> WATCH)
{
  const reading = {
    zoneId: 'zone-1',
    vibration: { x: 0.1, y: 0.1, z: 0.1 },
    tempC: 25,
    gasPpm: 1200,
    waterDetected: false,
    roofDistanceCm: 200
  };

  const result = evaluateReading(reading);
  console.log('Test 2 (Gas > 1000ppm):', result.riskScore, result.status, result.riskFactors);
  assert.strictEqual(result.riskScore, 0.3);
  assert.strictEqual(result.status, 'WATCH');
  assert.ok(result.riskFactors.includes('gasPpm'));
}

// Test 3: High Vibration + High Temp -> 0.3 + 0.2 = 0.5 (WATCH)
{
  const reading = {
    zoneId: 'zone-2',
    vibration: { x: 1.0, y: 1.0, z: 1.0 }, // sqrt(3) = 1.732 > 1.5 -> +0.3
    tempC: 48, // > 45 -> +0.2
    gasPpm: 100,
    waterDetected: false,
    roofDistanceCm: 200
  };

  const result = evaluateReading(reading);
  console.log('Test 3 (Vibration + Temp):', result.riskScore, result.status);
  assert.strictEqual(result.riskScore, 0.5);
  assert.strictEqual(result.status, 'WATCH');
  assert.ok(result.riskFactors.includes('vibration'));
  assert.ok(result.riskFactors.includes('tempC'));
}

// Test 4: Critical Breach (Vibration + Gas + Water = 0.3 + 0.3 + 0.1 = 0.7 -> CRITICAL)
{
  const reading = {
    zoneId: 'zone-3',
    vibration: { x: 1.0, y: 1.0, z: 1.0 }, // +0.3
    tempC: 25,
    gasPpm: 1500, // +0.3
    waterDetected: true, // +0.1
    roofDistanceCm: 200
  };

  const result = evaluateReading(reading);
  console.log('Test 4 (Critical breach):', result.riskScore, result.status, result.riskFactors);
  assert.strictEqual(result.riskScore, 0.7);
  assert.strictEqual(result.status, 'CRITICAL');
  assert.ok(result.riskFactors.includes('vibration'));
  assert.ok(result.riskFactors.includes('gasPpm'));
  assert.ok(result.riskFactors.includes('waterDetected'));
}

// Test 5: Roof Sag Detection (Drop > 15% from rolling baseline)
{
  resetBaselines();
  // Feed 10 readings at 200cm baseline
  for (let i = 0; i < 10; i++) {
    evaluateReading({
      zoneId: 'zone-roof',
      vibration: { x: 0, y: 0, z: 0 },
      tempC: 20,
      gasPpm: 50,
      waterDetected: false,
      roofDistanceCm: 200
    });
  }

  // Now feed a reading where roof drops to 160cm (20% drop from 200cm -> >15%)
  const dropReading = {
    zoneId: 'zone-roof',
    vibration: { x: 0, y: 0, z: 0 },
    tempC: 20,
    gasPpm: 50,
    waterDetected: false,
    roofDistanceCm: 160
  };

  const result = evaluateReading(dropReading);
  console.log('Test 5 (Roof sag drop):', result.riskScore, result.riskFactors);
  assert.strictEqual(result.riskScore, 0.3);
  assert.ok(result.riskFactors.includes('roofDistanceCm'));
}

// Test 6: Score Capping at 1.0
{
  // Establish baseline of 200 for zone-max
  for (let i = 0; i < 10; i++) {
    evaluateReading({
      zoneId: 'zone-max',
      roofDistanceCm: 200
    });
  }

  const reading = {
    zoneId: 'zone-max',
    vibration: { x: 2.0, y: 2.0, z: 2.0 }, // +0.3
    tempC: 55, // +0.2
    gasPpm: 2000, // +0.3
    waterDetected: true, // +0.1
    roofDistanceCm: 100 // dropped from 200 -> 50% drop > 15% -> +0.3 => total 1.2 capped at 1.0
  };

  const result = evaluateReading(reading);
  console.log('Test 6 (Capped at 1.0):', result.riskScore, result.status);
  assert.strictEqual(result.riskScore, 1.0);
  assert.strictEqual(result.status, 'CRITICAL');
}


// Test 7: SMS Rate Limit (1 per zone per 5 minutes)
{
  lastSmsSentMap.clear();
  const zone = 'zone-test';
  assert.strictEqual(canSendSms(zone), true, 'First SMS should be allowed');

  lastSmsSentMap.set(zone, Date.now());
  assert.strictEqual(canSendSms(zone), false, 'Immediate second SMS should be blocked');

  // Simulated 6 minutes later
  lastSmsSentMap.set(zone, Date.now() - (6 * 60 * 1000));
  assert.strictEqual(canSendSms(zone), true, 'SMS after 6 minutes should be allowed');
  console.log('Test 7 (SMS 5-minute rate limit): PASSED');
}

console.log('\n✅ All unit tests passed successfully!\n');
process.exit(0);

