import React, { useState } from 'react';
import { X, Check, AlertOctagon, CheckCircle2, Clock, PhoneCall, Filter } from 'lucide-react';
import { acknowledgeAlert } from '../services/api';

export default function AlertLog({ isOpen, onClose, alerts = [], onAlertAcknowledged }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unack'
  const [ackingId, setAckingId] = useState(null);

  if (!isOpen) return null;

  const handleAck = async (id) => {
    try {
      setAckingId(id);
      const res = await acknowledgeAlert(id);
      if (res.success && onAlertAcknowledged) {
        onAlertAcknowledged(res.data);
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setAckingId(null);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'unack') return !a.acknowledged;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-[#0F172A] border-l border-white/10 shadow-2xl h-full flex flex-col p-6 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-5 h-5 text-critical" />
              <h2 className="text-lg font-bold text-white">Emergency Alert Log</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Twilio SMS dispatches & critical incident logs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between my-4 text-xs">
          <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === 'all' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Events ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unack')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === 'unack' ? 'bg-critical/30 text-critical font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unacknowledged ({alerts.filter(a => !a.acknowledged).length})
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            Auto-synced via Socket.io
          </span>
        </div>

        {/* List of Alerts */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredAlerts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 mb-2 opacity-30 text-safe" />
              <p className="text-sm font-medium">No alerts matching criteria</p>
              <p className="text-xs text-slate-600">All underground zones reporting within safe limits.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isAck = alert.acknowledged;
              const dateStr = alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Unknown';

              return (
                <div
                  key={alert._id}
                  className={`p-4 rounded-xl border transition-all ${
                    isAck
                      ? 'bg-white/[0.02] border-white/5 opacity-70'
                      : 'bg-critical/[0.08] border-critical/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40 text-slate-200 border border-white/10">
                        {alert.zoneId}
                      </span>
                      <span className="text-xs font-bold text-critical uppercase">
                        CRITICAL RISK: {(alert.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>

                    {isAck ? (
                      <span className="flex items-center space-x-1 text-[11px] font-semibold text-safe bg-safe/10 px-2 py-0.5 rounded border border-safe/20">
                        <Check className="w-3 h-3" />
                        <span>Acknowledged</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAck(alert._id)}
                        disabled={ackingId === alert._id}
                        className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-safe/20 hover:bg-safe/30 text-safe border border-safe/40 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{ackingId === alert._id ? 'Saving...' : 'Acknowledge'}</span>
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-300 mb-2">
                    Primary Breach: <span className="font-semibold text-white capitalize">{alert.topFactor || 'Sensor Threshold Breach'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400">
                      <PhoneCall className="w-3 h-3 text-accent" />
                      <span>{alert.smsSent ? 'SMS Dispatched' : 'SMS Rate-Limited / Mock'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Close Alert Log
          </button>
        </div>

      </div>
    </div>
  );
}
