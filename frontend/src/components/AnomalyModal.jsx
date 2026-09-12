import React, { useState } from 'react';
import { X, Zap, AlertTriangle, Flame, Activity, ArrowDownToLine, Droplets, Check } from 'lucide-react';
import { injectDemoAnomaly } from '../services/api';

export default function AnomalyModal({ isOpen, onClose, zones = [], initialZoneId = null, onInjected }) {
  const [selectedZone, setSelectedZone] = useState(initialZoneId || 'zone-2');
  const [selectedType, setSelectedType] = useState('gas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const hazardTypes = [
    {
      id: 'gas',
      label: 'Methane / Toxic Gas Leak',
      desc: 'gasPpm > 1000 (+0.3) + Temp > 45°C (+0.2) + Vibration (+0.3) -> 0.8 CRITICAL',
      icon: Flame,
      color: 'text-amber-400 border-amber-500/30'
    },
    {
      id: 'vibration',
      label: 'Structural Vibration Spike',
      desc: 'Vibration magnitude > 1.5g (+0.3) + Gas > 1000 (+0.3) -> 0.6 CRITICAL',
      icon: Activity,
      color: 'text-purple-400 border-purple-500/30'
    },
    {
      id: 'roofSag',
      label: 'Mine Roof Sag / Cave-in Risk',
      desc: 'Roof distance drops > 15% from rolling baseline (+0.3) + Vibration (+0.3) -> 0.6 CRITICAL',
      icon: ArrowDownToLine,
      color: 'text-blue-400 border-blue-500/30'
    },
    {
      id: 'water',
      label: 'Rapid Water Ingress / Flooding',
      desc: 'waterDetected = true (+0.1) + Gas (+0.3) + Vibration (+0.3) -> 0.7 CRITICAL',
      icon: Droplets,
      color: 'text-cyan-400 border-cyan-500/30'
    },
    {
      id: 'combined',
      label: 'Combined Multi-Hazard Failure',
      desc: 'Simultaneous breach of gas, heat, water, roof sag and vibration -> 1.0 MAX CRITICAL',
      icon: AlertTriangle,
      color: 'text-red-400 border-red-500/30'
    }
  ];

  const handleInject = async () => {
    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await injectDemoAnomaly(selectedZone, selectedType);
      setFeedback({
        type: 'success',
        text: `Anomaly injected! ${selectedZone} risk score: ${res.reading?.riskScore || 0.8} (${res.reading?.status || 'CRITICAL'})`
      });
      if (onInjected) onInjected();
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 1500);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to inject anomaly' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg glass-modal rounded-2xl p-6 shadow-2xl border border-white/15">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-critical/20 border border-critical/40 flex items-center justify-center text-critical">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Inject Simulated Anomaly</h3>
              <p className="text-xs text-slate-400">Live Hackathon & Judge Demonstration Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="my-5 space-y-4">
          
          {/* Target Zone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Mine Zone
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
            >
              {zones.map(z => (
                <option key={z.zoneId} value={z.zoneId}>
                  {z.name || z.zoneId} ({z.zoneId})
                </option>
              ))}
            </select>
          </div>

          {/* Hazard Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Anomaly Hazard Scenario
            </label>
            <div className="space-y-2">
              {hazardTypes.map(hazard => {
                const Icon = hazard.icon;
                const isSelected = selectedType === hazard.id;

                return (
                  <div
                    key={hazard.id}
                    onClick={() => setSelectedType(hazard.id)}
                    className={`cursor-pointer p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-accent/15 border-accent shadow-sm'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-black/30 border ${hazard.color} mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{hazard.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-accent" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{hazard.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-safe/20 text-safe border border-safe/30'
                : 'bg-critical/20 text-critical border border-critical/30'
            }`}>
              {feedback.text}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInject}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-critical-glow transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{isSubmitting ? 'Injecting Hazard...' : 'Trigger Live Hazard'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
