import { useMemo } from 'react';

/**
 * Titik pantau stabilitas lereng = kejadian longsor + pin anomali InSAR.
 * Kemiringan: kejadian → DEM Copernicus 90 m (pipeline tahap events); anomali → DEM LiCSAR.
 */
export default function useMonitoringPoints({ events, anomalies, sentinel }) {
  return useMemo(
    () => [
      ...events.map((f) => ({
        id: f.id,
        kind: 'event',
        feature: f,
        coord: f.geometry.coordinates,
        slopeDeg: sentinel[f.properties.no]?.terrain?.slope_deg ?? null,
      })),
      ...anomalies.map((f) => ({
        id: f.id,
        kind: 'anomaly',
        feature: f,
        coord: f.geometry.coordinates,
        slopeDeg: f.properties.slope_deg ?? null,
      })),
    ],
    [events, anomalies, sentinel]
  );
}
