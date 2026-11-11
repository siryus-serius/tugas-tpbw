import { useMemo, useState } from 'react';
import { DEFAULT_SOIL_PARAMS, classifyFS, factorOfSafety } from '../utils/factorOfSafety';

/**
 * Faktor Keamanan per titik dari kemiringan lereng + parameter tanah (m tetap = kondisi lembap).
 * Dihitung ulang seketika saat parameter tanah diubah. Hasil per id: { slopeDeg, m, fs, cls }.
 */
export default function useSlopeStability(points) {
  const [params, setParams] = useState(DEFAULT_SOIL_PARAMS);

  const byId = useMemo(() => {
    const out = new Map();
    for (const p of points) {
      const fs = factorOfSafety({ slopeDeg: p.slopeDeg, m: params.saturation, ...params });
      out.set(p.id, { slopeDeg: p.slopeDeg, m: params.saturation, fs, cls: classifyFS(fs) });
    }
    return out;
  }, [points, params]);

  const updateParam = (key, value) => setParams((p) => ({ ...p, [key]: value }));
  const resetParams = () => setParams(DEFAULT_SOIL_PARAMS);

  return { byId, params, updateParam, resetParams };
}
