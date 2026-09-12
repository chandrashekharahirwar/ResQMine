# ResQ Mine — Technical Requirements Document

## 1. MQTT Contract
Topic structure: `resqmine/{zoneId}/telemetry`

Payload:
```json
{
  "zoneId": "zone-1",
  "timestamp": "2026-09-13T10:22:00.000Z",
  "vibration": { "x": 0.0, "y": 0.0, "z": 0.0 },
  "tempC": 0.0,
  "humidity": 0.0,
  "waterDetected": false,
  "soundLevel": 0,
  "roofDistanceCm": 0,
  "gasPpm": 0
}
```
QoS: 1 (at-least-once). Occasional reading loss is acceptable, but a reading that would trigger an alert shouldn't silently vanish. Retry/reconnect logic lives in the publisher (ESP32 firmware or the simulation script); the backend write path is idempotent so a duplicate delivery doesn't double-count.

## 2. Backend Requirements
- Node.js (v18+) + Express
- MQTT client: `mqtt` npm package, subscribed to `resqmine/+/telemetry`
- On message: validate payload shape → write to MongoDB → run anomaly scoring → emit via Socket.io → if critical, call the alert module
- Anomaly scoring must complete in well under 100ms per reading — no blocking I/O in that path. The DB write can be fire-and-forget with error logging so it never delays the live dashboard push.

## 3. Anomaly Scoring Rules (v1 — rule-based, explainable)
Each field contributes a bounded risk value; contributions sum to a 0–1 score.

| Condition | Contribution |
|---|---|
| Vibration magnitude > 1.5g | 0.3 |
| tempC > 45°C | 0.2 |
| gasPpm > 1000 ppm | 0.3 |
| waterDetected == true | 0.1 |
| roofDistanceCm drops >15% from rolling baseline | 0.3 |

Score is capped at 1.0. Zone status:
- 0.0–0.3 → **SAFE** (green)
- 0.3–0.6 → **WATCH** (yellow)
- 0.6–1.0 → **CRITICAL** (red) → triggers alert

Rolling baseline = mean of the last 50 readings per zone per field, recomputed every 10 readings and held in memory (see `design.md` for why this isn't persisted).

## 4. REST API
- `GET /api/zones` — list zones with latest status
- `GET /api/zones/:id/history?range=1h` — time-series data for graphs
- `GET /api/alerts` — alert log
- `POST /api/alerts/:id/ack` — control room acknowledges an alert
- `POST /api/simulate/anomaly` — demo-only endpoint to force an anomaly into a chosen zone, so the live demo doesn't depend on random timing. Not meant to exist in a production build.

## 5. Alerting
- SMS via Twilio for this software track — reliable over venue WiFi
- SIM800L is the intended path for real underground deployment where cellular data/WiFi may not reach; it's documented, not built into this MVP, to avoid depending on two alert paths at once during judging
- Message template: `"ResQ Mine ALERT: Zone {zoneId} CRITICAL ({riskScore}). Cause: {topContributingFactor}. Time: {timestamp}"`
- Rate limit: max 1 SMS per zone per 5 minutes, to prevent alert flooding during a sustained incident

## 6. Simulation Layer Requirements
- Standalone Node or Python script publishing to the same MQTT topics as real hardware, using the identical payload schema
- Default: 4 zones, publishing every 3 seconds, randomized-but-plausible values around safe baselines
- Must support a manual "inject anomaly" trigger (CLI flag or the `/api/simulate/anomaly` endpoint) — never leave anomaly timing to chance during a live demo

## 7. Frontend Requirements
- React + `socket.io-client`, sub-200ms latency from event to render
- Connection loss must be visible, not silent — show a "reconnecting…" state rather than freezing on stale data

## 8. Non-Functional Requirements
- No secrets in source; use `.env`, gitignored
- Validate all MQTT payloads and API request bodies; reject malformed data rather than crashing the process
- The demo must survive a brief WiFi blip without an app restart

## 9. Pre-Demo Testing Checklist
- [ ] Kill the MQTT broker connection mid-run, confirm auto-reconnect
- [ ] Force an anomaly via `/api/simulate/anomaly`, confirm dashboard update + SMS arrival within 5s
- [ ] Restart the backend, confirm the dashboard reflects last known state on reconnect
- [ ] Run continuously for 15+ minutes without a memory leak or crash
