# ResQ Mine — Design Decisions Log

Recorded here so any team member — or a judge who asks "why did you choose X" — gets a consistent, honest answer instead of an improvised one.

## Why threshold/z-score scoring instead of ML
An ML model (isolation forest, LSTM) sounds more impressive on a slide but has three real costs here: it needs labeled or realistic training data we don't have from an actual mine; it becomes a black box exactly when someone asks "how did you decide this is dangerous," where a rule-based score can be explained field-by-field in one sentence; and it costs build time we don't have in a hackathon window. This is stated as a deliberate v1 choice, with an ML upgrade path noted as future work once real sensor data exists to train on.

## Why MQTT instead of sensors calling an HTTP endpoint directly
HTTP means the backend has to be up and reachable before any sensor can report anything. MQTT decouples that — a broker sits in between, so sensors, the simulation script, and the backend can start in any order and reconnect independently. It's also the protocol family real systems like Trolex and Newtrax use for this kind of telemetry, so it's a legitimate technical parallel, not just a shortcut.

## Why MongoDB over a relational database
Sensor readings are naturally document-shaped — nested vibration x/y/z, and the field set can vary as sensors are added. The main query pattern (recent time-series per zone) matches MongoDB's time-series collections well, and it's a stack we already have experience with, which removes tooling risk from the build.

## Why simulate zones instead of building more physical nodes
Cost and time. One real ESP32 node proves the hardware pipeline works end to end; four more physical nodes would cost more, take longer to wire and calibrate, and add failure points on demo day — WiFi range, power, physical damage in transit. A simulation script publishing to the identical MQTT contract proves the software scales to multiple zones without that risk. This is stated plainly to judges rather than implied as five physical units.

## Why Twilio for this demo, SIM800L for the real-deployment story
Twilio is simpler to demo reliably over venue WiFi. SIM800L — which is already owned and has been used before — is the honest answer for actual underground deployment, where cellular data or WiFi may not reach but a bare GSM signal might. That path is described in the pitch as the real-world approach, not built into this MVP, so the demo doesn't depend on two alert paths working at once under judging conditions.

## Known limitations, stated up front
- The rolling baseline resets on backend restart — it's in-memory, not persisted
- No authentication on the dashboard or the demo anomaly-injection endpoint
- Thresholds are hand-tuned constants, not derived from real mine data
- SMS is rate-limited to 1 per zone per 5 minutes, which is a demo safety measure as much as a designed feature
