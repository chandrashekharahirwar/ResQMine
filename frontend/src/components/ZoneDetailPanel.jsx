import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Flame, 
  Activity, 
  Thermometer, 
  Droplets, 
  ArrowDownToLine, 
  Volume2, 
  AlertTriangle,
  Info,
  History,
  CheckCircle,
  Zap
} from 'lucide-react';
import { fetchZoneHistory } from '../services/api';

export default function ZoneDetailPanel({ zone, isOpen, onClose, onSimulateHazard }) {
  const [activeMetric, setActiveMetric] = useState('gasPpm');
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const canvasRef = useRef(null);

  const reading = zone?.latestReading;
  const status = zone?.status || 'SAFE';
  const riskScore = zone?.riskScore || reading?.riskScore || 0;
  const contributions = reading?.contributions || {};

  // Fetch 1h history whenever zone changes or panel opens
  useEffect(() => {
    if (!zone || !isOpen) return;

    let isMounted = true;
    setIsLoadingHistory(true);
    fetchZoneHistory(zone.zoneId, '1h').then((data) => {
      if (isMounted) {
        setHistoryData(data || []);
        setIsLoadingHistory(false);
      }
    });

    return () => { isMounted = false; };
  }, [zone?.zoneId, isOpen]);

  // Render 1-hour history canvas graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement.clientWidth || 500;
    const height = 180;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (historyData.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Accumulating time-series data...', width / 2, height / 2);
      return;
    }

    // Extract values based on activeMetric
    const values = historyData.map(d => {
      if (activeMetric === 'vibration') {
        const v = d.vibration || { x: 0, y: 0, z: 0 };
        return Math.sqrt(v.x**2 + v.y**2 + v.z**2);
      }
      return Number(d[activeMetric]) || 0;
    });

    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const valRange = maxVal - minVal || 1;

    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      const labelVal = (maxVal - (valRange / 3) * i).toFixed(1);
      ctx.fillText(labelVal, padding.left - 8, y + 3);
    }

    // Draw curve
    const step = chartW / Math.max(values.length - 1, 1);
    ctx.beginPath();

    const metricColor = activeMetric === 'gasPpm' ? '#F5C542' :
                        activeMetric === 'vibration' ? '#A855F7' :
                        activeMetric === 'tempC' ? '#FB923C' : '#3ED598';

    values.forEach((v, i) => {
      const x = padding.left + i * step;
      const y = padding.top + chartH - ((v - minVal) / valRange) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = metricColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Area fill
    ctx.lineTo(padding.left + (values.length - 1) * step, padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    grad.addColorStop(0, metricColor + '44');
    grad.addColorStop(1, metricColor + '00');
    ctx.fillStyle = grad;
    ctx.fill();

  }, [historyData, activeMetric, isOpen]);

  if (!isOpen || !zone) return null;

  // Factor breakdown data for the stacked bar
  const factorLabels = {
    vibration: { label: 'Vibration (>1.5g)', max: 0.3, color: 'bg-purple-500' },
    tempC: { label: 'Temp (>45°C)', max: 0.2, color: 'bg-orange-500' },
    gasPpm: { label: 'Gas (>1000ppm)', max: 0.3, color: 'bg-amber-500' },
    waterDetected: { label: 'Water Detected', max: 0.1, color: 'bg-cyan-500' },
    roofDistanceCm: { label: 'Roof Sag (>15%)', max: 0.3, color: 'bg-blue-500' }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Slide-in Overlay Panel */}
      <div className="w-full max-w-2xl bg-[#0F172A] border-l border-white/10 shadow-2xl h-full overflow-y-auto flex flex-col p-6 sm:p-8 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span>{zone.zoneId}</span>
              <span>•</span>
              <span className="text-accent">Live Telemetry & Diagnostics</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {zone.name || `Zone ${zone.zoneId}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explainable Risk Scoring Engine Section */}
        <div className="my-6 p-5 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-white">Rule-Based Explainable Risk Engine</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase border ${
                status === 'CRITICAL' ? 'bg-critical/20 text-critical border-critical/50 animate-pulse' :
                status === 'WATCH' ? 'bg-watch/20 text-watch border-watch/50' :
                'bg-safe/20 text-safe border-safe/50'
              }`}>
                {status} ({(riskScore * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Transparent scoring per TRT.md: each threshold breach adds a bounded risk contribution. Total score is capped at 1.0.
          </p>

          {/* Horizontal Stacked Risk Bar */}
          <div className="w-full bg-slate-800/80 rounded-lg h-6 p-0.5 flex overflow-hidden border border-white/10 mb-3">
            {Object.entries(contributions).map(([factor, value]) => {
              const info = factorLabels[factor] || { label: factor, color: 'bg-red-500' };
              const widthPct = (value / 1.0) * 100;
              if (value <= 0) return null;

              return (
                <div
                  key={factor}
                  style={{ width: `${widthPct}%` }}
                  className={`${info.color} h-full transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-black font-mono`}
                  title={`${info.label}: +${value.toFixed(1)}`}
                >
                  +{value.toFixed(1)}
                </div>
              );
            })}
            {riskScore === 0 && (
              <div className="w-full h-full bg-safe/25 flex items-center justify-center text-[10px] font-semibold text-safe">
                0.0 SAFE (No threshold breaches)
              </div>
            )}
          </div>

          {/* Contributing Factor Legend & Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(factorLabels).map(([key, item]) => {
              const activeVal = contributions[key] || 0;
              const isActive = activeVal > 0;

              return (
                <div
                  key={key}
                  className={`p-2 rounded-lg border flex items-center justify-between ${
                    isActive ? 'bg-white/10 border-white/20 text-white' : 'bg-white/[0.02] border-white/5 text-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-sm ${item.color} ${!isActive && 'opacity-30'}`} />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </div>
                  <span className="font-mono font-bold text-[11px]">
                    {isActive ? `+${activeVal.toFixed(1)}` : '0.0'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Live Sensor Readings */}
        <div className="mb-6">
          <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">
            Active Telemetry Sensors
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center text-xs text-slate-400 mb-1">
                <Thermometer className="w-4 h-4 text-orange-400 mr-1.5" />
                <span>Ambient Temp</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-white">
                {reading ? `${Number(reading.tempC).toFixed(1)} °C` : '--'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Threshold: &gt; 45°C</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center text-xs text-slate-400 mb-1">
                <Flame className="w-4 h-4 text-amber-400 mr-1.5" />
                <span>Gas (Methane/CO)</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-white">
                {reading ? `${Math.round(reading.gasPpm)} ppm` : '--'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Threshold: &gt; 1000 ppm</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center text-xs text-slate-400 mb-1">
                <Activity className="w-4 h-4 text-purple-400 mr-1.5" />
                <span>Vibration Mag</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-white">
                {reading?.metrics?.vibrationMagnitude || (reading?.vibration ? Math.sqrt(reading.vibration.x**2 + reading.vibration.y**2 + reading.vibration.z**2).toFixed(2) : '--')} g
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Threshold: &gt; 1.5g</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center text-xs text-slate-400 mb-1">
                <ArrowDownToLine className="w-4 h-4 text-blue-400 mr-1.5" />
                <span>Roof Distance</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-white">
                {reading ? `${Number(reading.roofDistanceCm).toFixed(1)} cm` : '--'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Baseline: {reading?.metrics?.roofBaseline || 200} cm (-15% sag)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center text-xs text-slate-400 mb-1">
                <Droplets className="w-4 h-4 text-teal-400 mr-1.5" />
                <span>Water Ingress</span>
              </div>
              <div className={`text-lg font-bold font-mono ${reading?.waterDetected ? 'text-critical' : 'text-safe'}`}>
                {reading?.waterDetected ? 'FLOOD ALERT' : 'DRY / CLEAR'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Optical conductivity</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center text-xs text-slate-400 mb-1">
                <Volume2 className="w-4 h-4 text-indigo-400 mr-1.5" />
                <span>Sound Level</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-white">
                {reading ? `${Math.round(reading.soundLevel)} dB` : '--'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Acoustic monitor</div>
            </div>

          </div>
        </div>

        {/* 1-Hour Historical Graph Section */}
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-white">1-Hour Time Series Graph</span>
            </div>

            {/* Toggleable Metric Buttons */}
            <div className="flex flex-wrap gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
              {[
                { id: 'gasPpm', label: 'Gas' },
                { id: 'vibration', label: 'Vibration' },
                { id: 'tempC', label: 'Temp' },
                { id: 'roofDistanceCm', label: 'Roof Sag' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMetric(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    activeMetric === tab.id
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full h-[180px]">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => onSimulateHazard(zone.zoneId)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-critical/20 hover:bg-critical/30 border border-critical/40 text-critical text-xs font-semibold transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span>Force Anomaly into {zone.zoneId}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
