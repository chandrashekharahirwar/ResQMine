import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ConnectionBanner from './components/ConnectionBanner';
import ZoneGrid from './components/ZoneGrid';
import ZoneDetailPanel from './components/ZoneDetailPanel';
import AlertLog from './components/AlertLog';
import AnomalyModal from './components/AnomalyModal';
import { fetchZones, fetchAlerts } from './services/api';
import { getSocket } from './services/socket';
import { ShieldCheck, AlertTriangle, AlertOctagon, Activity, Cpu } from 'lucide-react';

export default function App() {
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [simulateTargetZone, setSimulateTargetZone] = useState('zone-2');

  // Load initial data
  useEffect(() => {
    fetchZones().then((data) => {
      // Initialize zone state with sparkline history buffer
      const initialized = data.map(z => ({
        ...z,
        historyScores: z.riskScore !== undefined ? [z.riskScore] : [0]
      }));
      setZones(initialized);
    });

    fetchAlerts().then((data) => {
      setAlerts(data);
    });
  }, []);

  // Wire Socket.io real-time listeners
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      console.log('[Dashboard] Connected to real-time server.');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.warn('[Dashboard] Disconnected from real-time server.');
      setIsConnected(false);
    };

    // Live telemetry update sub-200ms
    const handleTelemetry = (reading) => {
      setZones((prevZones) => {
        return prevZones.map((z) => {
          if (z.zoneId === reading.zoneId) {
            const currentHistory = z.historyScores || [];
            const nextHistory = [...currentHistory, reading.riskScore].slice(-16);
            return {
              ...z,
              latestReading: reading,
              status: reading.status,
              riskScore: reading.riskScore,
              lastUpdated: reading.timestamp,
              historyScores: nextHistory
            };
          }
          return z;
        });
      });

      // Also update selectedZone if it's currently open in the detail panel
      setSelectedZone((prev) => {
        if (prev && prev.zoneId === reading.zoneId) {
          return {
            ...prev,
            latestReading: reading,
            status: reading.status,
            riskScore: reading.riskScore
          };
        }
        return prev;
      });
    };

    // Emergency alert push
    const handleAlert = (newAlert) => {
      setAlerts((prev) => {
        // Prevent duplicates
        if (prev.some(a => a._id === newAlert._id)) return prev;
        return [newAlert, ...prev];
      });
    };

    // Alert acknowledgement broadcast
    const handleAlertAck = (ackedAlert) => {
      setAlerts((prev) =>
        prev.map(a => a._id === ackedAlert._id ? ackedAlert : a)
      );
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('telemetry', handleTelemetry);
    socket.on('alert', handleAlert);
    socket.on('alert_ack', handleAlertAck);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('telemetry', handleTelemetry);
      socket.off('alert', handleAlert);
      socket.off('alert_ack', handleAlertAck);
    };
  }, []);

  // Compute status metrics for summary cards
  const totalZones = zones.length;
  const criticalCount = zones.filter(z => z.status === 'CRITICAL').length;
  const watchCount = zones.filter(z => z.status === 'WATCH').length;
  const safeCount = zones.filter(z => z.status === 'SAFE' || !z.status).length;
  const unreadAlerts = alerts.filter(a => !a.acknowledged).length;

  const handleSimulateHazard = (zoneId) => {
    setSimulateTargetZone(zoneId);
    setIsSimulateOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1120] via-[#0E1626] to-[#131C2E] text-slate-100 flex flex-col font-sans selection:bg-accent/30 selection:text-white">
      
      {/* Full-width Connection Drop Banner */}
      <ConnectionBanner isConnected={isConnected} />

      {/* Navigation Top Bar */}
      <Navbar
        isConnected={isConnected}
        unreadAlertCount={unreadAlerts}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenSimulate={() => {
          setSimulateTargetZone('zone-2');
          setIsSimulateOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Header & Summary Counters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span>Mine Safety Control Center</span>
                <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                  MQTT Ingestion Active
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Real-time multi-zone environmental telemetry, seismic vibration tracking, and automated rescue dispatch.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-black/30 px-3 py-2 rounded-xl border border-white/5">
              <Activity className="w-4 h-4 text-accent animate-pulse" />
              <span>Telemetry Interval: <strong>3.0s</strong></span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Total Zones */}
            <div className="glass-panel p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-accent">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-white">{totalZones}</div>
                <div className="text-xs text-slate-400 font-medium">Monitored Zones</div>
              </div>
            </div>

            {/* Safe Status */}
            <div className="glass-panel p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-safe/10 border border-safe/20 flex items-center justify-center text-safe">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-safe">{safeCount}</div>
                <div className="text-xs text-slate-400 font-medium">Normal / Safe</div>
              </div>
            </div>

            {/* Watch Status */}
            <div className="glass-panel p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-watch/10 border border-watch/20 flex items-center justify-center text-watch">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-watch">{watchCount}</div>
                <div className="text-xs text-slate-400 font-medium">Watch Condition</div>
              </div>
            </div>

            {/* Critical Status */}
            <div className={`glass-panel p-4 flex items-center space-x-3.5 transition-all ${
              criticalCount > 0 ? 'border-critical/50 bg-critical/10 shadow-critical-glow animate-pulse' : ''
            }`}>
              <div className="w-10 h-10 rounded-xl bg-critical/20 border border-critical/30 flex items-center justify-center text-critical">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-critical">{criticalCount}</div>
                <div className="text-xs text-slate-400 font-medium">Critical Incidents</div>
              </div>
            </div>

          </div>
        </div>

        {/* Live Zones Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Underground Sector Telemetry Grid
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Click any sector to inspect diagnostic breakdown & history
            </span>
          </div>

          <ZoneGrid
            zones={zones}
            onSelectZone={(zone) => setSelectedZone(zone)}
          />
        </section>

      </main>

      {/* Slide-in Zone Detail Panel */}
      <ZoneDetailPanel
        zone={selectedZone}
        isOpen={Boolean(selectedZone)}
        onClose={() => setSelectedZone(null)}
        onSimulateHazard={handleSimulateHazard}
      />

      {/* Slide-in Alert Log Drawer */}
      <AlertLog
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onAlertAcknowledged={(updated) => {
          setAlerts(prev => prev.map(a => a._id === updated._id ? updated : a));
        }}
      />

      {/* Demo Anomaly Trigger Modal */}
      <AnomalyModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        zones={zones}
        initialZoneId={simulateTargetZone}
        onInjected={() => {
          fetchAlerts().then(setAlerts);
        }}
      />

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        ResQ Mine Safety Monitoring System • Smart India Hackathon 2026 (SIH26039) • Software Track Phase 1-4
      </footer>

    </div>
  );
}
