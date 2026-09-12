import React from 'react';
import ZoneCard from './ZoneCard';

export default function ZoneGrid({ zones, onSelectZone }) {
  const now = Date.now();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
      {zones.map((zone) => {
        // Stale if no reading or timestamp older than 30s
        const lastTimestamp = zone.latestReading?.timestamp 
          ? new Date(zone.latestReading.timestamp).getTime() 
          : 0;
        const isStale = !lastTimestamp || (now - lastTimestamp > 30000);

        return (
          <ZoneCard
            key={zone.zoneId}
            zone={zone}
            isStale={isStale}
            onClick={() => onSelectZone(zone)}
          />
        );
      })}
    </div>
  );
}
