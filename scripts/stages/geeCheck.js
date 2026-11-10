/**
 * Tahap "gee-check": memastikan login Earth Engine berfungsi dan data Sentinel dapat diakses.
 * Menghitung jumlah scene Sentinel-1 GRD & Sentinel-2 SR (+ Cloud Score+) di Jawa Barat bulan lalu.
 */
import { JABAR_BBOX } from '../config.js';
import { evaluate, initGee } from '../lib/gee.js';

export async function runGeeCheck({ log = console.log } = {}) {
  const ee = await initGee();
  const region = ee.Geometry.Rectangle(JABAR_BBOX);
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);

  const s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filterBounds(region).filterDate(start, end);
  const csp = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED').filterBounds(region).filterDate(start, end);
  const s1 = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(region).filterDate(start, end);

  const counts = await evaluate(ee.Dictionary({ s2: s2.size(), cloudScorePlus: csp.size(), s1: s1.size() }));
  log(`[✔] Login GEE berhasil (project ${process.env.GEE_PROJECT}). Periode ${start} s.d. ${end}:`);
  log(`    Sentinel-2 SR: ${counts.s2} scene · Cloud Score+: ${counts.cloudScorePlus} · Sentinel-1 GRD: ${counts.s1} scene`);
  if (!counts.s2 || !counts.s1) throw new Error('Login berhasil tetapi koleksi Sentinel kosong — periksa izin project.');
}
