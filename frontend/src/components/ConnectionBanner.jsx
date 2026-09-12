import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function ConnectionBanner({ isConnected }) {
  if (isConnected) return null;

  return (
    <div className="w-full bg-critical/95 text-white px-4 py-3 shadow-lg border-b border-white/20 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertOctagon className="w-6 h-6 animate-pulse text-white flex-shrink-0" />
          <div>
            <span className="font-semibold text-sm md:text-base">Backend Connection Interrupted</span>
            <p className="text-xs text-white/80">
              Live telemetry push halted. Attempting automatic reconnection to telemetry broker...
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-black/25 px-3 py-1.5 rounded-lg border border-white/20">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Reconnecting...</span>
        </div>
      </div>
    </div>
  );
}
