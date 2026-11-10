/**
 * Kemiringan lereng di sekitar titik dari Copernicus DEM GLO-90 via Open-Meteo Elevation API (tanpa login).
 * Dipakai untuk titik kejadian (koordinat pusat desa) → ambil persentil-90 lereng dalam radius ±400 m,
 * karena longsor terjadi di lereng terjal sekitar desa, bukan tepat di titik pusatnya.
 */
import { fetchRetry } from './http.js';

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
  const slopes = [];
  for (let r = 1; r < N - 1; r++) {
    for (let c = 1; c < N - 1; c++) {
      const i = r * N + c;
      const gx = (z[i + 1] - z[i - 1]) / (2 * STEP_M);
      const gy = (z[i - N] - z[i + N]) / (2 * STEP_M);
      slopes.push((Math.atan(Math.hypot(gx, gy)) * 180) / Math.PI);
    }
  }
  slopes.sort((a, b) => a - b);
  return {
    slope_deg: Math.round(slopes[Math.floor(0.9 * (slopes.length - 1))] * 10) / 10,
    elevation_m: Math.round(z[Math.floor((N * N) / 2)]),
  };
}
