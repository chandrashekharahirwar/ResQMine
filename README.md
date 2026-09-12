# ResQMine 🦺⛏️
### AI-Powered Underground Mine Safety, Monitoring & Rescue System

> **Problem Statement ID:** SIH26039  
> **Category:** Govt. of Jharkhand — Hardware / Software (IoT + AI Anomaly Detection)  
> **Status:** Architecture & Prototype Planning

---

## 📌 Overview
Underground mining is among the most hazardous industrial activities globally. Structural instability (rockfall, subsidence), hazardous gas accumulation (methane, CO), and water ingress often escalate unnoticed until casualties occur. Existing commercial systems (Trolex, Newtrax, Strata Worldwide) are cost-prohibitive for tier-2/tier-3 mining operations.

**ResQMine** is a cost-effective, IoT + AI proof-of-concept integrating multi-sensor telemetry, explainable anomaly detection, real-time control-room dashboard monitoring, and dual-channel dispatch alerts (Dashboard + SMS).

---

## 🏗️ Architecture & High-Level Flow

```
[ESP32 Sensor Node] --MQTT (WiFi/LoRa)--> [HiveMQ Cloud Broker]
                                                |
                                       [Node.js Backend]
                                                |
                                  [MongoDB: Readings & Scores]
                                                |
                                       [Socket.io Realtime]
                                                |
                                       [React Live Dashboard]
                                                |
                            (if anomaly_score > threshold)
                                                |
                                  [SIM800L / Twilio SMS Dispatch]

[Python Zone Simulator] ---MQTT Topics---> (Feeds simulated zones B, C, D...)
```

---

## 🚀 Key Features

1. **Multi-Sensor Edge Telemetry**:
   - **MPU6050**: Rockfall / vibration / seismic tilt.
   - **MQ-2 / MQ-7**: Combustible & hazardous toxic gas leaks.
   - **Ultrasonic**: Roof sag and floor convergence monitoring.
   - **DHT11**: Temperature & humidity fluctuations.
   - **Rain / Level Sensor**: Water ingress detection.
   - **HW-484 Sound Sensor**: Structural fracture / abnormal acoustic spikes.

2. **Explainable Sensor Fusion & Risk Scoring**:
   - Rolling baseline computation (mean & standard deviation per zone).
   - Z-score deviation analysis.
   - Dual-sensor consensus rule to minimize false positives.
   - Composite risk index (0–100) mapped to Normal (Green), Warning (Yellow), and Critical (Red).

3. **Real-Time Control Room Dashboard**:
   - Glassmorphic industrial UI built in React.
   - Real-time Socket.io status per mine zone.
   - Physical vs. simulated zone badges for clear auditability.
   - Live telemetry trends and historical alert logs.

4. **Dual-Channel Emergency Dispatch**:
   - Automated GSM SMS dispatch via SIM800L (with Twilio API fallback) directly to rescue crews.
   - Audio-visual evacuation alerts on the physical node.

---

## 📁 Repository Structure

```
├── firmware/         # ESP32 C++ Arduino firmware for edge sensor nodes
├── backend/          # Node.js + Express + Socket.io + MQTT telemetry service
├── frontend/         # React + Tailwind glassmorphic operator dashboard
├── simulator/        # Python multi-zone telemetry simulator
├── PRD.md            # Product Requirements Document (SIH26039)
├── architecture.md   # Detailed end-to-end system architecture
├── design.md         # Data models, risk formulas & UI/UX specifications
├── phases.md         # 36-hour sprint implementation roadmap
└── cursorrules       # Development guidelines and coding standards
```

---

## ⚙️ Setup & Roadmap

See [phases.md](phases.md) for the sprint implementation schedule across firmware, ingestion pipeline, anomaly scoring, and dashboard integration.
