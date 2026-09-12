# PRD — AI-Powered Underground Mine Safety, Monitoring and Rescue System

**Problem Statement ID:** SIH26039
**Category:** Govt. of Jharkhand — Hardware/Software (IoT + AI)
**Team Size:** 3 members

---

## 1. Problem Statement

Underground mines lack real-time, low-cost hazard monitoring. Gas leaks, structural
instability (rockfall/subsidence), water ingress, and worker safety incidents are
often detected too late, causing casualties. Existing commercial solutions
(Trolex, Newtrax, Strata Worldwide) are expensive, certified, and out of reach for
smaller/tier-2 Indian mines.

## 2. Goal (What We're Actually Building)

A **low-cost, ESP32-based proof-of-concept** that senses key underground hazard
signals, runs simple explainable anomaly detection, and triggers dual-channel
alerts (dashboard + SMS) — demonstrating that meaningful mine safety monitoring
doesn't require expensive certified hardware to prototype and validate the concept.

**This is explicitly a PoC, not a certified production system.** Real deployment
would require intrinsically-safe (ATEX) certified hardware and DGMS compliance —
this is called out as future work, not hidden.

## 3. Users / Stakeholders

- **Mine control room operator** — watches the live dashboard, receives alerts
- **Underground worker** — carries/benefits from the wearable safety node (future scope)
- **Rescue team** — receives SMS/dispatch alerts on critical anomaly

## 4. Core Features (MVP scope — see `phases.md` for full breakdown)

| # | Feature | Priority |
|---|---------|----------|
| 1 | Single ESP32 sensor node (vibration, temp/humidity, water, sound) | Must-have |
| 2 | MQTT telemetry → backend ingestion | Must-have |
| 3 | Threshold/z-score based anomaly detection (explainable) | Must-have |
| 4 | Live React dashboard (status per zone, color-coded risk) | Must-have |
| 5 | Simulated multi-zone data (Python script feeding same MQTT topic pattern) | Must-have |
| 6 | SMS alert on critical anomaly (SIM800L or Twilio) | Must-have |
| 7 | Local SD card logging (offline resilience) | Should-have |
| 8 | Servo-actuated barrier/vent demo | Nice-to-have |
| 9 | Worker wearable node (PIR, panic button) | Future scope |
| 10 | LoRa mesh comms | Future scope (mention only) |

## 5. Success Criteria (for the hackathon demo)

- Live sensor data visibly flows from physical ESP32 → dashboard in real time
- A manually triggered anomaly (e.g., shaking the board) produces a visible
  dashboard alert **and** an SMS within a few seconds
- Judges can be shown the exact threshold/logic that caused the alert
  (explainability)
- Simulated zones behave consistently with the real node's data pattern

## 6. Non-Goals (explicitly out of scope for this build)

- Real underground deployment or certification
- Multi-node physical mesh network
- Machine-learning model training on real mine datasets (none available)
- Long-term historical analytics / compliance reporting

## 7. Known Constraints & Risks

- No real mine data available → anomaly thresholds are based on published
  safety standards (DGMS/OSHA-style limits) + statistical simulation, not
  real sensor history — **must be stated honestly to judges**
- WiFi/MQTT will not work in a real underground mine (no signal) — demo runs
  on WiFi for simplicity; real deployment would need LoRa or wired backbone
- Off-the-shelf ESP32 electronics are not intrinsically safe — cannot be used
  near real methane-rich environments without certification

## 8. Reused Assets

- MQTT + sensor node pattern from **InfraGuard** (STPI x IIT Guwahati finalist)
- GPS + SOS/SMS dispatch logic from **ResQ RoadSOS**
- Glassmorphic dashboard UI pattern from **Smart Home Dashboard**
