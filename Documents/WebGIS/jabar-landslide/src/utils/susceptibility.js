/**
 * Indeks kerawanan longsor (prediksi kualitatif, 0–1) per titik pantau.
 *
 *   I = Σ wᵢ·sᵢ / Σ wᵢ   (hanya komponen yang datanya tersedia)
 *   s_FK     = (1,6 − FK) / 0,6, dibatasi 0–1 (FK ≤ 1,0 → 1; FK ≥ 1,6 → 0), m = 0,5   w = 0,5
 *   s_InSAR  = tingkat anomali (sedang 0,5 · tinggi 0,75 · sangat tinggi 1)
 *              × faktor konsistensi lereng (ya 1 · tak pasti 0,7 · tidak 0,4)        w = 0,3
 *              (titik kejadian: anomali tahun aktif terdekat ≤ 1,5 km)
 *   s_gempa  = guncangan gempa 30 hari terakhir (lihat utils/seismic.js)          w = 0,2
 *
 * Kelas: < 0,25 rendah · < 0,5 sedang · < 0,75 tinggi · ≥ 0,75 sangat tinggi.
 * Bobot ditetapkan secara heuristik (FK sebagai faktor fisik utama); belum dikalibrasi statistik.
 */
import { distanceKm, recentShakingScore } from './seismic';

export const WEIGHTS = { fk: 0.5, insar: 0.3, gempa: 0.2 };

export const RISK_CLASSES = [
  { key: 'rendah', label: 'Rendah', max: 0.25, color: '#16a34a' },
  { key: 'sedang', label: 'Sedang', max: 0.5, color: '#eab308' },
  { key: 'tinggi', label: 'Tinggi', max: 0.75, color: '#f97316' },
  { key: 'sangat-tinggi', label: 'Sangat tinggi', max: Infinity, color: '#dc2626' },
];

const SEVERITY_SCORE = { sedang: 0.5, tinggi: 0.75, 'sangat tinggi': 1 };
const CONSISTENCY = { true: 1, null: 0.7, false: 0.4 };
const clamp01 = (x) => Math.min(1, Math.max(0, x));

export const classifyRisk = (index) => (index == null ? null : RISK_CLASSES.find((c) => index < c.max));

function insarScore(anomaly) {
  const p = anomaly.properties;
  return (SEVERITY_SCORE[p.severity] ?? 0.5) * CONSISTENCY[p.konsisten_lereng ?? null];
}

/**
 * @param point     {id, coord, kind: 'event'|'anomaly', feature}
 * @param stability hasil useSlopeStability untuk titik ini
 */
export function susceptibility(point, { stability, yearAnomalies, quakes }) {
  const parts = {};
  const fs = stability?.fs;
  if (fs != null) parts.fk = fs === Infinity ? 0 : clamp01((1.6 - fs) / 0.6);

  if (point.kind === 'anomaly') parts.insar = insarScore(point.feature);
  else {
    const near = yearAnomalies.filter((a) => distanceKm(point.coord, a.geometry.coordinates) <= 1.5);
    parts.insar = near.length ? Math.max(...near.map(insarScore)) : 0;
  }
  parts.gempa = recentShakingScore(point.coord, quakes);

  const keys = Object.keys(parts);
  const wSum = keys.reduce((s, k) => s + WEIGHTS[k], 0);
  const index = keys.reduce((s, k) => s + WEIGHTS[k] * parts[k], 0) / wSum;
  return { index, cls: classifyRisk(index), parts, partial: !('fk' in parts) };
}
