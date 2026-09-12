# Phases — SIH26039 Mine Safety System (36-Hour Build Plan)

## Phase 0 — Setup (Hour 0–4)
- Finalize architecture, create repo structure (firmware / backend / frontend / simulator)
- Wire up ESP32 with core sensors (MPU6050, DHT11, rain, sound, ultrasonic)
- Verify each sensor gives sane raw readings via Serial Monitor
- Set up HiveMQ Cloud broker + test a basic publish/subscribe
- **Owner:** Hardware/Firmware lead

## Phase 1 — Telemetry Pipeline (Hour 4–10)
- ESP32 publishes real sensor JSON to MQTT topics
- Node.js backend subscribes, parses, writes to MongoDB
- Confirm end-to-end: sensor change on the board → new document in MongoDB
- **Owner:** Backend/AI-ML lead

## Phase 2 — Anomaly Logic (Hour 10–18)
- Implement rolling baseline (mean/std-dev) per sensor per zone
- Implement z-score deviation check + weighted composite risk score
- Implement sensor-fusion rule (2+ sensors must agree for "critical")
- Unit-test with manually injected fake spikes
- **Owner:** Backend/AI-ML lead

## Phase 3 — Dashboard (Hour 18–26)
- Build React dashboard shell (glassmorphic theme)
- Socket.io live updates wired to backend emit events
- Zone cards with color-coded risk + alert log panel
- Per-zone detail chart view
- **Owner:** Frontend/Dashboard lead

## Phase 4 — Simulation Layer (parallel, Hour 10–20)
- Python script publishing to `zone-2`, `zone-3` etc. with realistic baseline +
  injected anomalies, on the same MQTT topic pattern
- Confirm dashboard treats simulated zones identically to real zone (except badge)
- **Owner:** Backend/AI-ML lead (can overlap with Phase 2)

## Phase 5 — Alerting (Hour 20–28)
- Wire SIM800L (AT commands) or Twilio for SMS dispatch on critical risk score
- Test with a manual shake/trigger on the physical board → confirm SMS received
- Add capacitor/voltage booster fix for SIM800L power stability
- **Owner:** Hardware/Firmware lead + Backend lead (joint)

## Phase 6 — End-to-End Testing (Hour 28–32)
- Full run-through: shake board → dashboard alert → SMS, timed
- Test WiFi drop/reconnect behavior on the ESP32
- Test simulator + real node running simultaneously without topic collisions
- Fix any timestamp/clock-drift issues (NTP sync)
- **Owner:** Whole team

## Phase 7 — Polish & Pitch Prep (Hour 32–36)
- UI polish pass (spacing, colors, labels)
- Prepare pitch deck: problem framing, PoC honesty framing, roadmap slide
  (LoRa, ATEX certification, DGMS compliance as future work)
- Rehearse demo + prepare answers for judge Q&A (data verification, threshold
  reasoning, decision logic — see Q&A notes)
- **Owner:** Whole team

---

## Buffer Note
Integration debugging historically takes longer than estimated — Phase 6 has
built-in buffer, but if any earlier phase runs over, pull time from Phase 7's
polish (not from Phase 6's end-to-end testing).
