import React from 'react';
import { ShieldAlert, Radio, AlertTriangle, Zap } from 'lucide-react';

export default function Navbar({ isConnected, unreadAlertCount, onOpenAlerts, onOpenSimulate }) {
  return (
    <header className="w-full bg-[#0B1120]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-blue-700 flex items-center justify-center shadow-glass-glow border border-accent/40">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">ResQ Mine</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
                SIH26039
              </span>
            </div>
            <p className="text-xs text-slate-400">Underground Mine Safety & Rescue Monitor</p>
          </div>
        </div>

        {/* Action Controls & Live Status */}
        <div className="flex items-center space-x-3 md:space-x-4">
          
          {/* Live Socket Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
            {isConnected ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-safe shadow-[0_0_8px_#3ED598] animate-pulse"></span>
                <span className="text-slate-200">Connected</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-critical shadow-[0_0_8px_#F5484D] animate-ping"></span>
                <span className="text-critical font-medium">Reconnecting…</span>
              </>
            )}
          </div>

          {/* Alert Log Drawer Button */}
          <button
            onClick={onOpenAlerts}
            className="relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-watch" />
            <span className="hidden sm:inline">Alert Log</span>
            {unreadAlertCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-critical text-white text-[10px] font-bold animate-pulse">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* Quick Demo Anomaly Trigger Button */}
          <button
            onClick={onOpenSimulate}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-semibold shadow-critical-glow transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Simulate Anomaly</span>
          </button>

        </div>
      </div>
    </header>
  );
}
