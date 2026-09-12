# ResQ Mine — System Architecture

## Component Diagram
```
+------------------+      +---------------------+
| ESP32 Hardware    |      | Simulation Script    |
| (separate track)  |      | (4-5 virtual zones)  |
+---------+---------+      +----------+-----------+
          |  MQTT publish             |  MQTT publish
          +-------------+-------------+
                        |
                        v
              +--------------------+
              |   MQTT Broker       |
              |   (HiveMQ Cloud)    |
              +---------+----------+
                        | subscribe
                        v
              +--------------------+
              |  Node.js Backend    |
              |  - MQTT client      |
              |  - Risk engine      |
              |  - REST API         |
              |  - Socket.io server |
              +----+-----------+----+
                   |           |
           write   |           | emit
                   v           v
          +-------------+  +----------------+
          | MongoDB      |  | React Frontend  |
          | (readings,   |  | (Socket.io      |
          | alerts,      |  |  client)        |
          | zones)       |  +----------------+
          +-------------+
                   |
         on critical alert
                   v
          +------------------+
          | Twilio SMS API    |
          +------------------+
```

## Why This Shape
- **MQTT as the single ingestion path** for both real and simulated data means the backend never needs to know or care whether a reading came from a physical ESP32 or the simulation script. This is the key decision that lets the hardware and software tracks be built completely independently and merge at the end with essentially zero integration risk, beyond pointing both at the same broker.
- **Socket.io over polling** because the dashboard needs to feel alive during judging — polling every few seconds is visibly laggier on a projector than a push-based update.
- **riskScore denormalized onto each reading**, computed once at ingest using visible rules, rather than recomputed on read. This keeps history queries fast and keeps the "how did you decide" answer simple and consistent — the score was fixed the moment the reading arrived, not reconstructed after the fact.

## Integration Point With Hardware Track
The only contract the hardware side needs to honor is the MQTT payload shape defined in `Backend-Schema.md`. Once the ESP32 firmware publishes to `resqmine/{zoneId}/telemetry` in that shape, it appears alongside the simulated zones with zero backend changes required.
