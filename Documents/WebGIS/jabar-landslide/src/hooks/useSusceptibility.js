import { useMemo } from 'react';
import { susceptibility } from '../utils/susceptibility';

/** Indeks kerawanan per titik pantau; dihitung ulang bila FK, anomali tahun aktif, atau gempa berubah. */
export default function useSusceptibility(points, { stability, yearAnomalies, quakes }) {
  return useMemo(() => {
    const out = new Map();
    for (const p of points) out.set(p.id, susceptibility(p, { stability: stability.get(p.id), yearAnomalies, quakes }));
    return out;
  }, [points, stability, yearAnomalies, quakes]);
}
