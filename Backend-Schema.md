# ResQ Mine — Backend Data Schema

## MongoDB Collections

### `zones`
```js
{
  _id: ObjectId,
  zoneId: String,      // "zone-1"
  name: String,        // "Tunnel A - Level 2"
  createdAt: Date
}
```

### `readings` (time-series collection)
```js
{
  _id: ObjectId,
  zoneId: String,
  timestamp: Date,
  vibration: { x: Number, y: Number, z: Number },
  tempC: Number,
  humidity: Number,
  waterDetected: Boolean,
  soundLevel: Number,
  roofDistanceCm: Number,
  gasPpm: Number,
  riskScore: Number,        // computed at ingest time, denormalized for fast reads
  riskFactors: [String]     // e.g. ["vibration", "gas"] — which fields contributed
}
```
Use MongoDB's native time-series collection type:
```js
db.createCollection("readings", {
  timeseries: { timeField: "timestamp", metaField: "zoneId" }
});
```
This keeps the history-graph range queries fast without hand-rolled bucketing, and it's a legitimate technical detail if a judge asks how this would hold up at scale.

### `alerts`
```js
{
  _id: ObjectId,
  zoneId: String,
  riskScore: Number,
  topFactor: String,
  timestamp: Date,
  smsSent: Boolean,
  acknowledged: Boolean,
  acknowledgedAt: Date
}
```

## Indexes
- `readings`: compound index on `{ zoneId: 1, timestamp: -1 }`
- `alerts`: index on `{ acknowledged: 1, timestamp: -1 }`

## Rolling Baseline
Kept in-memory on the backend process as a `Map<zoneId, Map<field, RollingWindow>>` holding the last 50 readings per zone per field. Recomputing this from the database on every incoming reading would add latency for no real benefit at this scale. It resets on server restart — a known, stated limitation, not a hidden bug (see `design.md`).

## REST API Summary
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/zones` | List zones with latest status |
| GET | `/api/zones/:id/history?range=1h` | Time-series data for graphs |
| GET | `/api/alerts` | Alert log |
| POST | `/api/alerts/:id/ack` | Acknowledge an alert |
| POST | `/api/simulate/anomaly` | Demo-only: force an anomaly into a chosen zone |
