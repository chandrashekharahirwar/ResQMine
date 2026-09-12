# ResQ Mine — Development Phases (Software Track)

Scope: backend, simulation layer, dashboard, alerts, docs. Hardware is a separate track and merges in at Phase 4.

## Phase 0 — Setup (Hour 0–2)
- Repo scaffolding: `backend/`, `frontend/`, `simulation/`
- HiveMQ Cloud broker provisioned, tested with a throwaway pub/sub script
- MongoDB Atlas cluster provisioned, connection verified
- Freeze the MQTT payload schema (`Backend-Schema.md`) — this is the one thing that must not change later, since the hardware track builds against it independently

## Phase 1 — Backend Core (Hour 2–8)
- MQTT subscriber wired into the Express app
- Reading validation and MongoDB write path
- Risk scoring engine (per `TRT.md`)
- Core REST endpoints: `/api/zones`, `/api/zones/:id/history`

## Phase 2 — Simulation + Live Verification (Hour 6–10, overlaps Phase 1)
- Simulation script publishing 4 zones on a schedule
- Manual anomaly injection working via CLI flag or the demo endpoint
- Confirm end to end: simulated reading → DB write → correct risk score

## Phase 3 — Frontend Dashboard (Hour 8–20)
- Socket.io wired on both ends
- Zone grid UI (per `UI-UX.md`)
- Zone detail panel with the risk-factor breakdown
- Alert log view
- Connection-state handling: reconnect banner, stale-zone graying

## Phase 4 — Alerts + Hardware Merge (Hour 18–26)
- Twilio SMS integration with rate limiting
- If the hardware track's ESP32 node is ready, point it at the same broker and confirm it appears as a live zone alongside the simulated ones with zero backend changes
- If hardware isn't ready yet, this phase proceeds fully on simulated data — the two tracks are independent by design (see `architecture.md`)

## Phase 5 — Hardening + Demo Rehearsal (Hour 26–32)
- Run the full pre-demo checklist from `TRT.md`
- Rehearse the exact anomaly-injection demo sequence at least three times, timed
- Prepare a fallback: if live hardware fails on stage, drop to a pure-simulation demo without missing a beat

## Phase 6 — Docs + Pitch (Hour 30–36)
- README with the architecture diagram and setup steps
- Slide deck: problem → solution → live demo → architecture → honest roadmap/limitations slide
- Mock Q&A prep pass

## Role Split
- **Backend/Data lead** — Phases 1, 2, and the alerting half of 4
- **Frontend/Dashboard lead** — Phase 3, contributes to 5
- **Hardware/Integration lead** — separate hardware track, joins for the Phase 4 merge, helps with Phase 6 docs
