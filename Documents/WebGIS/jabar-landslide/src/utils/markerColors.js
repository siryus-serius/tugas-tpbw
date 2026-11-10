import { EVENT_COLOR, SEVERITY, UNKNOWN_COLOR } from '../config/constants';

/** Warna isi titik sesuai mode: kategori (tahun/tingkat anomali) atau kelas Faktor Keamanan. */
export function eventColor(feature, { year, colorMode, stability }) {
  if (colorMode === 'stabilitas') return stability.get(feature.id)?.cls?.color ?? UNKNOWN_COLOR;
  return feature.properties.tahun === year ? EVENT_COLOR.current : EVENT_COLOR.other;
}

export function anomalyColor(feature, { colorMode, stability }) {
  if (colorMode === 'stabilitas') return stability.get(feature.id)?.cls?.color ?? UNKNOWN_COLOR;
  return SEVERITY[feature.properties.severity]?.color ?? UNKNOWN_COLOR;
}
