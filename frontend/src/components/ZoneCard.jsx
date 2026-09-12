import React from 'react';
import { 
  Flame, 
  Activity, 
  Thermometer, 
  Droplets, 
  ArrowDownToLine, 
  Volume2, 
  AlertCircle,
  Clock,
  WifiOff,
  ChevronRight
} from 'lucide-react';
import Sparkline from './Sparkline';

export default function ZoneCard({ zone, isStale, onClick }) {
  const reading = zone.latestReading;
  const status = zone.status || 'SAFE';
  const riskScore = typeof zone.riskScore === 'number' ? zone.riskScore : (reading?.riskScore || 0.0);

  // Status-based accent styling
  let statusColor = '#3ED598'; // Safe
  let statusBg = 'bg-safe/10 text-safe border-safe/30';
  let cardBorder = 'border-white/10 hover:border-accent/40';

  if (isStale) {
    statusColor = '#94A3B8';
    statusBg = 'bg-slate-700/40 text-slate-400 border-slate-600/40';
    cardBorder = 'border-slate-800 opacity-60';
  } else if (status === 'CRITICAL') {
    statusColor = '#F5484D';
    statusBg = 'bg-critical/20 text-critical border-critical/40';
    cardBorder = 'border-critical/60 shadow-critical-glow animate-critical-pulse';
  } else if (status === 'WATCH') {
    statusColor = '#F5C542';
    statusBg = 'bg-watch/15 text-watch border-watch/40';
    cardBorder = 'border-watch/40';
  }

  // Extract metrics
  const temp = reading ? `${Number(reading.tempC).toFixed(1)}°C` : '--';
  const gas = reading ? `${Math.round(reading.gasPpm)} ppm` : '--';
  const vibMag = reading?.metrics?.vibrationMagnitude 
    ? `${reading.metrics.vibrationMagnitude}g` 
    : reading?.vibration 
      ? `${Math.sqrt(reading.vibration.x**2 + reading.vibration.y**2 + reading.vibration.z**2).toFixed(2)}g` 
      : '--';
  const roof = reading ? `${Math.round(reading.roofDistanceCm)} cm` : '--';
  const humidity = reading ? `${Math.round(reading.humidity)}%` : '--';
  const water = reading?.waterDetected ? 'DETECTED' : 'None';

  // Last update time
  const timeString = reading?.timestamp
    ? new Date(reading.timestamp).toLocaleTimeString()
    : 'No data';

  return (
    <div
      onClick={onClick}
      className={`glass-panel-interactive cursor-pointer p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-200 ${cardBorder}`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{zone.zoneId}</span>
              {isStale && (
                <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  <WifiOff className="w-2.5 h-2.5" />
                  <span>No signal (30s+)</span>
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
              {zone.name || `Zone ${zone.zoneId}`}
            </h3>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end">
            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border tracking-wide uppercase ${statusBg}`}>
              {isStale ? 'NO SIGNAL' : status}
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-400 mt-1">
              Risk: <span className="font-bold text-white">{(riskScore * 100).toFixed(0)}%</span>
            </span>
          </div>
        </div>

        {/* Sparkline Banner */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/25 border border-white/5 my-2">
          <div className="text-[11px] text-slate-400 font-medium">Risk Trend (10m)</div>
          <Sparkline
            data={zone.historyScores || [riskScore, riskScore]}
            color={statusColor}
            width={110}
            height={26}
          />
        </div>

        {/* Compact Key Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-white/5 text-xs">
          
          {/* Temperature */}
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/5">
            <div className="flex items-center text-slate-400 text-[10px] mb-1">
              <Thermometer className="w-3 h-3 text-orange-400 mr-1" />
              <span>Temp</span>
            </div>
            <div className={`font-mono tabular-nums font-semibold ${reading && reading.tempC > 45 ? 'text-critical' : 'text-slate-100'}`}>
              {temp}
            </div>
          </div>

          {/* Gas Concentration */}
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/5">
            <div className="flex items-center text-slate-400 text-[10px] mb-1">
              <Flame className="w-3 h-3 text-amber-400 mr-1" />
              <span>Gas</span>
            </div>
            <div className={`font-mono tabular-nums font-semibold ${reading && reading.gasPpm > 1000 ? 'text-critical' : 'text-slate-100'}`}>
              {gas}
            </div>
          </div>

          {/* Vibration */}
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/5">
            <div className="flex items-center text-slate-400 text-[10px] mb-1">
              <Activity className="w-3 h-3 text-purple-400 mr-1" />
              <span>Vib Mag</span>
            </div>
            <div className={`font-mono tabular-nums font-semibold text-slate-100`}>
              {vibMag}
            </div>
          </div>

          {/* Roof Distance */}
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/5">
            <div className="flex items-center text-slate-400 text-[10px] mb-1">
              <ArrowDownToLine className="w-3 h-3 text-blue-400 mr-1" />
              <span>Roof Dist</span>
            </div>
            <div className="font-mono tabular-nums font-semibold text-slate-100">
              {roof}
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/5">
            <div className="flex items-center text-slate-400 text-[10px] mb-1">
              <Droplets className="w-3 h-3 text-teal-400 mr-1" />
              <span>Humidity</span>
            </div>
            <div className="font-mono tabular-nums font-semibold text-slate-100">
              {humidity}
            </div>
          </div>

          {/* Water Ingress */}
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/5">
            <div className="flex items-center text-slate-400 text-[10px] mb-1">
              <AlertCircle className="w-3 h-3 text-cyan-400 mr-1" />
              <span>Water</span>
            </div>
            <div className={`font-mono tabular-nums font-semibold ${reading?.waterDetected ? 'text-critical font-bold' : 'text-slate-400'}`}>
              {water}
            </div>
          </div>

        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5 font-mono">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{timeString}</span>
        </div>
        <div className="flex items-center space-x-1 text-accent font-medium group-hover:translate-x-1 transition-transform">
          <span>Inspect</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
