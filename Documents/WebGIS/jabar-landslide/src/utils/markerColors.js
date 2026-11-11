import { EVENT_COLOR, SEVERITY, UNKNOWN_COLOR } from '../config/constants';
import { inYear } from './years';

/**
 * Warna isi titik sesuai mode:
 *  kategori   → tahun kejadian / tingkat anomali
 *  stabilitas → kelas Faktor Keamanan lereng
 *  kerawanan  → kelas indeks kerawanan (prediksi)
 */
function indicatorColor(id, { colorMode, stability, risk }) {
  if (colorMode === 'stabilitas') return stability.get(id)?.cls?.color ?? UNKNOWN_COLOR;
  if (colorMode === 'kerawanan') return risk.get(id)?.cls?.color ?? UNKNOWN_COLOR;
  return null;
}

export function eventColor(feature, ctx) {
  return (
    indicatorColor(feature.id, ctx) ??
    (inYear(feature.properties.tahun, ctx.year) ? EVENT_COLOR.current : EVENT_COLOR.other)
  );
}

export function anomalyColor(feature, ctx) {
  return indicatorColor(feature.id, ctx) ?? SEVERITY[feature.properties.severity]?.color ?? UNKNOWN_COLOR;
}
