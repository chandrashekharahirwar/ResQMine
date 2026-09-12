# ResQ Mine — UI/UX Specification

## Design Language
Dark glassmorphic theme, consistent with the earlier Smart Home Dashboard build — it reads as a "control room" rather than a generic admin panel, and holds up well on a projector during judging.

**Palette**
- Background: deep navy/charcoal gradient, `#0B1120 → #131C2E`
- Glass panels: `rgba(255,255,255,0.06)` fill, `backdrop-filter: blur(12px)`, 1px `rgba(255,255,255,0.12)` border
- Status colors: Safe `#3ED598`, Watch `#F5C542`, Critical `#F5484D` — slightly desaturated rather than pure red/green, reads better under harsh venue lighting
- Accent: `#5B8DF7` for interactive elements
- Type: Inter or system-ui, tabular numerals for live-updating readouts so digits don't jitter the layout as they change

## Pages / Views

### 1. Main Dashboard (default view)
- Top bar: system name, live connection indicator (green dot + "Connected" / red + "Reconnecting…")
- Zone grid, one card per zone: name, current status color, compact stat rows (temp, vibration, gas), and a small sparkline of the risk score over the last 10 minutes
- Clicking a card opens the Zone Detail panel as a slide-in overlay, not a full page navigation — keeps the demo flow fast and avoids re-render flicker

### 2. Zone Detail Panel
- Full live sensor breakdown
- Risk score shown as a horizontal stacked bar, segmented by contributing factor — this is the direct visual answer to "how did you decide the result," so it should be explicit on screen, not something you have to explain verbally from a code file
- 1-hour historical graph per sensor field, toggleable between fields

### 3. Alert Log
- Reverse-chronological list: timestamp, zone, risk score, top contributing factor, acknowledged state
- Acknowledge button per entry

### 4. Connection / Error States
- A zone with no data for 30+ seconds visually grays out with a "No signal" label — never show stale numbers as if they're live
- A dropped backend socket shows a full-width banner, not a small corner toast — it needs to be impossible to miss during a live demo

## Interaction Notes
- No page reloads for live updates — everything goes through the socket push
- Keep transitions subtle, 150–200ms — avoid animation flourishes that read as template flashiness
- Numbers should visibly tick/update rather than snap instantly, so the "live-ness" is obvious to someone glancing at the screen from a few feet away

## Explicit Non-Goals
- No login screen for the MVP demo — don't spend demo time on an auth flow
- No settings/configuration UI — thresholds are backend constants for this version
