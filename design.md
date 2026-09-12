# Design — SIH26039 Mine Safety System

## 1. Design Principles

- **Explainability over sophistication** — judges (and real operators) must be
  able to see *why* an alert fired. Rule-based/z-score logic is preferred over
  opaque ML for this build.
- **Honesty over polish** — simulated data is clearly labeled as simulated;
  no claim is made that this is production-ready or certified.
- **Reuse over reinvention** — every layer maps to a previously-built project
  (InfraGuard, ResQ RoadSOS, Smart Home Dashboard) to reduce build risk.

## 2. Data Model (MongoDB)

### Collection: `readings`
```json
{
  "zoneId": "zone-1",
  "sensorType": "vibration | temp | humidity | water | sound | ultrasonic | gas",
  "value": 0.0,
  "timestamp": "ISO8601",
  "isSimulated": false
}
```

### Collection: `alerts`
```json
{
  "zoneId": "zone-1",
  "riskScore": 82,
  "triggeringSensors": ["vibration", "sound"],
  "severity": "warning | critical",
  "timestamp": "ISO8601",
  "smsSent": true
}
```

### Collection: `zones` (for simulator + dashboard config)
```json
{
  "zoneId": "zone-2",
  "label": "Simulated Zone B",
  "isPhysical": false
}
```

## 3. Risk Scoring Design

- Each sensor's live value is compared to a rolling baseline (mean, std-dev)
  computed from recent normal-condition readings.
- Deviation beyond ~2–3 std-dev → that sensor contributes to the composite
  risk score.
- Composite score = weighted sum of contributing sensor deviations
  (weights: vibration & gas weighted higher than sound/temp, since they are
  more directly tied to structural/life-safety risk).
- Thresholds:
  - Score 0–40 → Normal (green)
  - Score 41–70 → Warning (yellow) — dashboard flag only
  - Score 71–100 → Critical (red) — dashboard flag + SMS dispatch
- **Sensor fusion rule:** a single-sensor spike alone does not reach "critical"
  tier; at least two independent sensors must agree to cross into critical,
  to reduce false alarms.

## 4. UI/UX Design (Dashboard)

- **Layout:** glassmorphic cards, dark background (mine/industrial theme),
  one card per zone
- **Zone card shows:** zone name, live risk score, color status, last-updated
  timestamp, physical vs simulated badge
- **Alert log:** scrollable list, most recent first, shows which sensors
  triggered each alert
- **Detail view (per zone):** live line chart of raw sensor values over the
  last N minutes (helps judges see the actual signal that caused an alert)

## 5. Hardware Layout (Single Combined Board)

All sensors wired to one ESP32 (38-pin) for the MVP — avoids building multiple
physical nodes and keeps cost near-zero (only gas sensor + buzzer/LED are
new purchases, ~₹150 total).

| Sensor | Purpose |
|---|---|
| MPU6050 | Vibration/tilt |
| DHT11 | Temp/humidity |
| Rain sensor | Water ingress (repurposed) |
| HW-484 | Abnormal sound |
| Ultrasonic | Roof distance/sagging |
| MQ-2/MQ-7 (new) | Gas detection |
| microSD | Offline logging |
| OLED | Local status |
| Buzzer + LED (new) | Local audible/visual alarm |
| SG90 servo | Barrier/vent actuation demo |

## 6. Pitch/Demo Design

- Lead with the working hardware — live shake test triggering a real alert +
  SMS is the strongest proof point
- Explicitly state which zones are simulated and why (36-hour hardware
  constraint, not a shortcut being hidden)
- Have the exact threshold numbers and reasoning ready for Q&A (see judge
  Q&A prep notes)
