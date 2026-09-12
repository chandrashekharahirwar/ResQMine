# ResQ Mine — Underground Mine Safety Monitoring & Rescue Coordination System
**Smart India Hackathon 2026 (SIH26039)**

ResQ Mine is a real-time, explainable underground mine safety monitoring system. It ingests multi-zone environmental and structural telemetry over MQTT, computes bounded risk scores in real-time, powers an interactive control room dashboard via WebSocket push, and triggers emergency SMS dispatches with rate-limiting.

---

## 🏗️ System Architecture

```
+------------------+      +---------------------+
| ESP32 Hardware   |      | Simulation Script   |
| (separate track) |      | (4 virtual zones)   |
+---------+--------+      +----------+----------+
          | MQTT publish             | MQTT publish
          +-------------+------------+
                        | (resqmine/{zoneId}/telemetry)
                        v
              +--------------------+
              |   MQTT Broker      |
              | (HiveMQ / Public)  |
              +---------+----------+
                        | subscribe (resqmine/+/telemetry)
                        v
              +--------------------+
              |  Node.js Backend   |
              |  - MQTT Ingestion  |
              |  - Risk Engine     |
              |  - REST API        |
              |  - Socket.io Push  |
              +----+-----------+---+
                   |           |
           write   |           | emit (sub-200ms)
                   v           v
          +-------------+  +----------------+
          |   MongoDB   |  | React Frontend |
          | (Readings,  |  | (Glassmorphic  |
          |  Alerts,    |  |  Dashboard)    |
          |  Zones)     |  +----------------+
          +-------------+
                   |
         on critical alert
                   v
          +------------------+
          |  Twilio SMS API  |
          | (or Mock Console)|
          +------------------+
```

---

## 📂 Project Structure

```
development_phase_one/
├── backend/                  # Node.js + Express + MQTT + Socket.io + Mongoose
│   ├── src/
│   │   ├── config/           # db.js (MongoDB + in-memory fallback), mqtt.js (subscriber & validation)
│   │   ├── models/           # Zone.js, Reading.js (time-series), Alert.js
│   │   ├── routes/           # zoneRoutes.js, alertRoutes.js, simulateRoutes.js
│   │   ├── services/         # riskEngine.js (rule-based scoring), alertService.js (Twilio + rate limiting), socketService.js
│   │   └── index.js          # Express app entry point (port 5000)
│   ├── test/                 # riskEngine.test.js (Unit tests for all TRT.md scoring rules)
│   └── .env.example
│
├── simulation/               # Standalone multi-zone sensor simulator
│   ├── simulator.js          # Publishes safe readings across 4 zones every 3s + interactive keyboard triggers
│   └── .env.example
│
└── frontend/                 # React + Tailwind CSS + Socket.io Client
    ├── src/
    │   ├── components/       # Navbar, ZoneCard, ZoneGrid, ZoneDetailPanel, AlertLog, AnomalyModal, Sparkline
    │   ├── services/         # api.js, socket.js
    │   ├── App.jsx           # Main control room layout
    │   └── index.css         # Dark glassmorphic styling, tabular numbers
    ├── vite.config.js
    └── tailwind.config.js
```

---

## ⚙️ Where You (The User) Need to Configure or Do Anything

The application is engineered with **zero-setup fallbacks**, meaning it runs completely out-of-the-box right now without signing up for any services. When you are ready to connect your production cloud accounts:

### 1. MongoDB Database
* **File to edit**: `backend/.env`
* **Variable**: `MONGODB_URI`
* **Default**: `mongodb://127.0.0.1:27017/resqmine`
* **Production Setup**: Replace with your MongoDB Atlas connection string:
  ```env
  MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/resqmine?retryWrites=true&w=majority
  ```
* *Fallback*: If MongoDB is not reachable, the backend automatically switches to an in-memory database store so the app never crashes.

### 2. MQTT Broker (HiveMQ Cloud)
* **Files to edit**: `backend/.env` and `simulation/.env`
* **Variables**: `MQTT_BROKER_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD`
* **Default**: `mqtt://broker.hivemq.com:1883` (Public broker active by default for immediate testing)
* **Production Setup**: For secure TLS HiveMQ Cloud:
  ```env
  MQTT_BROKER_URL=mqtts://your-cluster-id.s1.eu.hivemq.cloud:8883
  MQTT_USERNAME=your_username
  MQTT_PASSWORD=your_password
  ```

### 3. Twilio SMS Alerts
* **File to edit**: `backend/.env`
* **Variables**:
  ```env
  TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  TWILIO_AUTH_TOKEN=your_auth_token
  TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
  CONTROL_ROOM_PHONE_NUMBER=+91XXXXXXXXXX
  ```
* *Fallback*: If left blank, the backend operates in **Mock SMS mode**, outputting prominently formatted alerts in the terminal with 5-minute per-zone rate limiting strictly enforced.

---

## 🚀 Running the System

### Option A: Run in Separate Terminals (Recommended for Demos)

1. **Terminal 1: Start Backend**
   ```bash
   cd backend
   npm start
   ```
   *Runs on `http://localhost:5000` with WebSocket on port 5000.*

2. **Terminal 2: Start Multi-Zone Simulator**
   ```bash
   cd simulation
   npm start
   ```
   *Continuously streams live telemetry for `zone-1`, `zone-2`, `zone-3`, and `zone-4` every 3 seconds.*

3. **Terminal 3: Start Frontend Dashboard**
   ```bash
   cd frontend
   npm run dev
   ```
   *Opens the Control Room Dashboard on `http://localhost:5173`.*

---

## 🧪 Running Automated Tests

To verify the mathematical risk engine scoring rules, bounded contributions, and SMS rate limiter:

```bash
cd backend
npm test
```

All 7 test suites validate:
- Safe baseline (0.0 score -> SAFE)
- Gas concentration breach > 1000 ppm (+0.3 -> WATCH)
- Vibration magnitude > 1.5g (+0.3) & Temp > 45°C (+0.2)
- Critical multi-hazard breach (+0.7 -> CRITICAL)
- Mine roof sag drop > 15% from in-memory rolling baseline
- Capping of cumulative score at 1.0
- 5-minute per-zone SMS rate limiting

---

## 🎯 How to Demonstrate to Hackathon Judges

1. Open the dashboard at `http://localhost:5173`. Point out the 4 underground zones updating every 3 seconds with green **SAFE** status and live tabular figures.
2. In the top bar, click **"Simulate Anomaly"** (or press `g` in the simulator terminal).
3. Select **"Methane / Toxic Gas Leak"** for **Zone 2** and click **Trigger Live Hazard**.
4. **Observe in under 2 seconds:**
   - Zone 2 card turns glowing **RED (CRITICAL)**.
   - Click the card: the **Slide-in Detail Panel** reveals the **explainable stacked risk bar**, showing judges exactly why the anomaly was triggered (`Gas +0.3`, `Temp +0.2`, `Vibration +0.3`).
   - The **1-Hour Historical Graph** immediately plots the gas concentration spike.
   - Open the **Alert Log** to view the incident entry and click **"Acknowledge"**.
   - Check the backend console (or control room phone) to verify the SMS alert:
     `ResQ Mine ALERT: Zone zone-2 CRITICAL (0.8). Cause: gasPpm. Time: ...`
5. Disconnect the backend or WiFi to demonstrate the **full-width reconnect banner** and **30s stale signal indicator**.
