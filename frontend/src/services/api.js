const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function fetchZones() {
  try {
    const res = await fetch(`${API_BASE}/zones`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching zones:', err);
    return [];
  }
}

export async function fetchZoneHistory(zoneId, range = '1h') {
  try {
    const res = await fetch(`${API_BASE}/zones/${zoneId}/history?range=${range}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error(`Error fetching history for ${zoneId}:`, err);
    return [];
  }
}

export async function fetchAlerts() {
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return [];
  }
}

export async function acknowledgeAlert(alertId) {
  try {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error acknowledging alert:', err);
    throw err;
  }
}

export async function injectDemoAnomaly(zoneId, type = 'gas') {
  try {
    const res = await fetch(`${API_BASE}/simulate/anomaly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId, type })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error injecting demo anomaly:', err);
    throw err;
  }
}
