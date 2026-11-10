/**
 * Kemiringan lereng di sekitar titik dari Copernicus DEM GLO-90 via Open-Meteo Elevation API (tanpa login).
 * Dipakai untuk titik kejadian (koordinat pusat desa) → ambil persentil-90 lereng dalam radius ±400 m,
 * karena longsor terjadi di lereng terjal sekitar desa, bukan tepat di titik pusatnya.
 */
import { fetchRetry } from './http.js';
import { circularMean } from './motion.js';

const ELEVATION_API = 'https://api.open-meteo.com/v1/elevation';
const N = 9; // grid 9×9 (81 titik ≤ batas 100 koordinat per request)
const STEP_M = 100;

export async function slopeAroundPoint(lng, lat) {
  const dLat = STEP_M / 110570;
  const dLng = STEP_M / (111320 * Math.cos((lat * Math.PI) / 180));
  const half = (N - 1) / 2;
  const lats = [];
  const lngs = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      lats.push((lat + (half - r) * dLat).toFixed(5));
      lngs.push((lng + (c - half) * dLng).toFixed(5));
    }
  }
  const { elevation: z } = await fetchRetry(`${ELEVATION_API}?latitude=${lats.join(',')}&longitude=${lngs.join(',')}`);
  const cells = [];
  for (let r = 1; r < N - 1; r++) {
    for (let c = 1; c < N - 1; c++) {
      const i = r * N + c;
      const dzE = (z[i + 1] - z[i - 1]) / (2 * STEP_M);
      const dzN = (z[i - N] - z[i + N]) / (2 * STEP_M); // baris 0 = utara
      cells.push({
        slope: (Math.atan(Math.hypot(dzE, dzN)) * 180) / Math.PI,
        aspect: ((Math.atan2(-dzE, -dzN) * 180) / Math.PI + 360) % 360, // arah lereng turun
      });
    }
  }
  const sorted = [...cells].sort((a, b) => a.slope - b.slope);
  const p90 = sorted[Math.floor(0.9 * (sorted.length - 1))].slope;
  // Arah lereng turun dominan dari 25% sel paling terjal (bobot = kemiringan)
  const steep = sorted.slice(Math.floor(0.75 * sorted.length));
  return {
    slope_deg: Math.round(p90 * 10) / 10,
    aspect_deg: Math.round(circularMean(steep.map((c) => c.aspect), steep.map((c) => c.slope))),
    elevation_m: Math.round(z[Math.floor((N * N) / 2)]),
  };
}
