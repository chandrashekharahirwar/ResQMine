# ResQ Mine — Product Requirements Document

## 1. Problem Statement
Underground coal and mineral mines in India largely lack affordable, real-time environmental and structural monitoring. Existing commercial systems (Trolex, Newtrax, Strata Worldwide) work well but are cost-prohibitive for small and mid-sized mines, leaving workers exposed to undetected hazards — gas buildup, structural instability, water ingress — until an incident has already happened. SIH26039 calls for an AI-powered monitoring and rescue-coordination system that addresses this gap.

## 2. What We're Building (This Phase)
This document scopes the **software stack only** — backend, simulation layer, dashboard, and alerting. Physical hardware (the ESP32 sensor node) is being built on a separate track and will plug into this system through the same MQTT contract once it's ready. The two tracks are designed to be independent until the final merge.

## 3. Goals
- Ingest sensor telemetry (real or simulated) over MQTT
- Detect anomalous conditions using an explainable, threshold/z-score based rule engine — not a black-box model
- Push live status to a web dashboard with zone-level risk visualization
- Trigger an SMS alert to a control-room number when risk crosses a defined threshold
- Demonstrate the concept scaling across multiple mine zones without needing multiple physical sensor deployments, via a simulation layer

## 4. Non-Goals (Explicitly Out of Scope)
- Machine-learning based anomaly detection (isolation forest / LSTM) — noted as future roadmap, not required for MVP credibility
- LoRa or any non-WiFi communication layer
- Intrinsically-safe / ATEX hardware certification
- Multi-tenant or multi-mine account system
- Native mobile app
- User authentication beyond a single control-room login, if time allows

## 5. Target User
A mine safety control-room operator monitoring one mine site with several underground zones.

## 6. Core Features (MVP)
| # | Feature | Priority |
|---|---|---|
| 1 | MQTT ingestion of sensor readings | P0 |
| 2 | Time-series storage in MongoDB | P0 |
| 3 | Rule-based anomaly scoring per zone | P0 |
| 4 | Real-time dashboard (Socket.io push) | P0 |
| 5 | SMS alert on critical threshold breach | P0 |
| 6 | Simulated multi-zone data generator | P0 |
| 7 | Alert history log | P1 |
| 8 | Historical sensor graphs | P1 |
| 9 | Servo/actuation trigger endpoint (stub for hardware) | P2 |

## 7. Success Criteria for Demo
- Dashboard shows 4–5 zones with live-updating status colors
- Injecting a simulated anomaly visibly changes a zone to "critical" within 2–3 seconds
- An SMS lands on a real phone during the anomaly demo
- The system recovers gracefully if the MQTT connection drops and reconnects

## 8. Assumptions
- One shared MQTT broker (HiveMQ Cloud free tier) serves both real hardware and simulated zones
- Sensor data format is fixed and versioned (see `Backend-Schema.md`) so hardware and simulation stay compatible without coordination during the build
- A single control-room phone number receives alerts — no dynamic recipient list in MVP

## 9. Constraints
- Built inside a hackathon window (~36 hours), by a 3-person team, two of whom own this software track
- Reuse existing codebases wherever it saves time — backend patterns from ResQ RoadSOS, dashboard UI patterns from Smart Home Dashboard
