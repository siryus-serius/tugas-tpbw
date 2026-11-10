import { useMemo, useState } from 'react';
import {
  DEFAULT_SOIL_PARAMS,
  classifyFS,
  factorOfSafety,
  saturationRatio,
} from '../utils/factorOfSafety';

/**
 * Menggabungkan kemiringan + kelembapan tanah + parameter tanah → Faktor Keamanan per titik.
 * Dihitung ulang otomatis setiap kali parameter atau data kelembapan berubah.
 *
 * Hasil per id: { slopeDeg, theta, thetaMax, m, mMax, fsNow, fsMin, cls } — `cls` memakai FK minimum
 * 72 jam (skenario terbasah) agar indikator bersifat peringatan dini.
 */
export default function useSlopeStability(points, moisture) {
  const [params, setParams] = useState(DEFAULT_SOIL_PARAMS);

  const byId = useMemo(() => {
    const out = new Map();
    for (const p of points) {
      const sm = moisture.get(p.id);
      const m = saturationRatio(sm?.now, params.porosity);
      const mMax = saturationRatio(sm?.max72h, params.porosity);
      const fsNow = factorOfSafety({ slopeDeg: p.slopeDeg, m, ...params });
      const fsMin = factorOfSafety({ slopeDeg: p.slopeDeg, m: mMax, ...params });
      out.set(p.id, {
        slopeDeg: p.slopeDeg,
        theta: sm?.now ?? null,
        thetaMax: sm?.max72h ?? null,
        m,
        mMax,
        fsNow,
        fsMin,
        cls: classifyFS(fsMin),
      });
    }
    return out;
  }, [points, moisture, params]);

  const updateParam = (key, value) => setParams((p) => ({ ...p, [key]: value }));
  const resetParams = () => setParams(DEFAULT_SOIL_PARAMS);

  return { byId, params, updateParam, resetParams };
}
