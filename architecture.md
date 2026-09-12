# Architecture — SIH26039 Mine Safety System

## 1. High-Level Flow

```
[ESP32 Sensor Node] --MQTT (WiFi)--> [HiveMQ Cloud Broker]
                                            |
                                   [Node.js Backend Subscriber]
                                            |
                              [MongoDB: raw readings + computed scores]
                                            |
                                   [Socket.io real-time emit]
                                            |
                                   [React Dashboard]
                                            |
                        (if anomaly_score > threshold)
                                            |
                              [SIM800L / Twilio SMS Alert]

[Python Simulator Script] --MQTT (same topic pattern)--> (feeds extra "virtual zones")
```

## 2. Components

### 2.1 Sensor Node (Firmware — ESP32 + Arduino C++)
Single physical board carrying:
- MPU6050 — vibration/tilt (structural instability)
- DHT11 — temperature/humidity
- Rain sensor — repurposed as water-ingress detector
- HW-484 sound sensor — abnormal noise (blast/rockfall)
- Ultrasonic sensor — roof-to-floor distance (sagging/collapse trend)
- (Optional, if sourced) MQ-2/MQ-7 — gas detection
- microSD module — local buffering when WiFi is down
- OLED — local status display

Publishes JSON payloads over MQTT, one topic per sensor group, QoS 1.

### 2.2 Telemetry Layer
- Broker: HiveMQ Cloud (free tier)
- Topics: `mine/zoneX/vibration`, `mine/zoneX/env`, `mine/zoneX/water`, `mine/zoneX/sound`
- QoS 1 to avoid silent packet loss on critical readings

### 2.3 Backend (Node.js + Express)
- MQTT subscriber client, ingests all zone topics
- Writes raw readings to MongoDB (time-series style collection, one doc per reading)
- Computes rolling mean/std-dev per sensor per zone → z-score anomaly check
- Combines multi-sensor z-scores into a single 0–100 risk score (sensor fusion —
  reduces false positives; a single sensor spike alone should not trigger critical alert)
- Emits live updates to frontend via Socket.io
- On risk score crossing threshold → calls alert module (SMS)

### 2.4 Anomaly / Risk Logic
Rule-based (explainable, not black-box ML — deliberate choice for hackathon
timeframe and judge Q&A clarity):
- Per-sensor z-score against rolling baseline
- Weighted combination → composite risk score
- Multi-sensor agreement required for "critical" tier (reduces false alarms)

### 2.5 Simulator (Python)
- Publishes to the same MQTT topic pattern under different `zoneX` identifiers
- Generates realistic baseline + occasional injected anomaly spikes
- Used to demonstrate "multi-zone at scale" without needing multiple physical boards

### 2.6 Frontend (React + Tailwind, glassmorphic style)
- Live zone map/grid — color-coded (green/yellow/red)
- Alert log panel with timestamp + which sensor(s) triggered it
- Socket.io client for real-time updates (no polling)

### 2.7 Alerting
- Primary: SIM800L (AT commands) for GSM SMS — works without WiFi/internet,
  realistic for underground context
- Fallback/demo-simplicity option: Twilio API (if SIM800L has connectivity issues on demo day)

### 2.8 Data Persistence & Offline Resilience
- microSD logs raw readings locally on the node when WiFi is unavailable
- (Documented, not necessarily fully implemented in MVP) sync-on-reconnect logic:
  node checks for buffered SD file on reconnect, replays unsent readings to MQTT

## 3. Tricky Integration Points

1. **ESP32 WiFi reconnect** — implement retry/reconnect loop; do not let a dropped
   WiFi connection silently kill the demo
2. **MQTT QoS** — use QoS 1 minimum for anomaly-relevant topics
3. **Clock sync** — sync ESP32 time via NTP so dashboard timestamps aren't confusing
4. **SIM800L power** — GSM transmit draws up to ~2A spikes; must use a separate
   voltage booster + ~1000µF capacitor on VCC, not raw USB power, or the board
   will brown-out/reset mid-transmit
5. **Simulator vs real node distinction** — simulator-fed zones and the real
   physical zone must be clearly labeled in the dashboard UI so judges know
   which is live hardware vs simulated

## 4. Deployment (for demo purposes)

- Frontend: Vercel
- Backend: Render/Railway
- Broker: HiveMQ Cloud free tier
- DB: MongoDB Atlas free tier
