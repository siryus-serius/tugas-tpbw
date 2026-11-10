/**
 * Faktor Keamanan (FK) lereng — model lereng tak hingga (infinite slope), Skempton & DeLory (1957):
 *
 *        c' + (γ − m·γw) · z · cos²β · tan φ'
 *   FK = ─────────────────────────────────────
 *               γ · z · sin β · cos β
 *
 *   c'  kohesi efektif (kPa)          φ'  sudut geser dalam efektif (°)
 *   γ   berat isi tanah (kN/m³)       γw  berat isi air = 9,81 kN/m³
 *   z   kedalaman bidang gelincir (m) β   kemiringan lereng (°)
 *   m   rasio muka air (0 kering … 1 jenuh penuh), diturunkan dari kelembapan tanah
 *
 * Klasifikasi (Bowles, 1989): FK < 1,07 labil · 1,07–1,25 kritis · > 1,25 stabil.
 */

export const GAMMA_W = 9.81;

/** Parameter default: tanah residual vulkanik (andosol/latosol) umum di Jawa Barat. */
export const DEFAULT_SOIL_PARAMS = {
  cohesion: 8, // c' kPa
  frictionAngle: 28, // φ' derajat
  unitWeight: 18, // γ kN/m³
  depth: 2, // z m
  porosity: 0.5, // n (= kadar air volumetrik saat jenuh)
};

export const SOIL_PARAM_FIELDS = [
  { key: 'cohesion', label: "Kohesi c'", unit: 'kPa', min: 0, max: 30, step: 1 },
  { key: 'frictionAngle', label: "Sudut geser φ'", unit: '°', min: 15, max: 40, step: 1 },
  { key: 'unitWeight', label: 'Berat isi γ', unit: 'kN/m³', min: 14, max: 22, step: 0.5 },
  { key: 'depth', label: 'Kedalaman z', unit: 'm', min: 0.5, max: 5, step: 0.5 },
  { key: 'porosity', label: 'Porositas n', unit: '', min: 0.35, max: 0.65, step: 0.01 },
];

export const FS_CLASSES = [
  { key: 'labil', label: 'Labil', max: 1.07, color: '#dc2626', note: 'longsor sering terjadi' },
  { key: 'kritis', label: 'Kritis', max: 1.25, color: '#f97316', note: 'pernah/berpotensi longsor' },
  { key: 'stabil', label: 'Stabil', max: Infinity, color: '#16a34a', note: 'longsor jarang terjadi' },
];

const rad = (deg) => (deg * Math.PI) / 180;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** Rasio muka air m dari kadar air volumetrik θ (m³/m³): derajat kejenuhan θ / n. */
export function saturationRatio(theta, porosity) {
  if (theta == null || Number.isNaN(theta)) return null;
  return clamp(theta / porosity, 0, 1);
}

/** FK lereng tak hingga. Mengembalikan Infinity untuk lereng (hampir) datar. */
export function factorOfSafety({ slopeDeg, m, cohesion, frictionAngle, unitWeight, depth }) {
  if (slopeDeg == null || m == null) return null;
  if (slopeDeg < 1) return Infinity;
  const beta = rad(slopeDeg);
  const resisting =
    cohesion + (unitWeight - m * GAMMA_W) * depth * Math.cos(beta) ** 2 * Math.tan(rad(frictionAngle));
  const driving = unitWeight * depth * Math.sin(beta) * Math.cos(beta);
  return resisting / driving;
}

export function classifyFS(fs) {
  if (fs == null) return null;
  return FS_CLASSES.find((c) => fs < c.max);
}

export const formatFS = (fs) => (fs == null ? '–' : fs === Infinity || fs > 10 ? '> 10' : fs.toFixed(2));
