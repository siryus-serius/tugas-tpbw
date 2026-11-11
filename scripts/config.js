/**
 * Konfigurasi tunggal pipeline data (path, frame LiCSAR, parameter metode).
 */
import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC_DATA = path.join(ROOT, 'Documents', 'WebGIS', 'jabar-landslide', 'public', 'data');

export const PATHS = {
  adm: path.join(PUBLIC_DATA, 'jabar-adm.json'),
  events: path.join(PUBLIC_DATA, 'longsor_jabar_2021_2026.geojson'),
  eventsOut: path.join(PUBLIC_DATA, 'sentinel_events.json'),
  insarOut: path.join(PUBLIC_DATA, 'insar'),
  insarCache: path.join(ROOT, 'data', 'insar', 'cache'),
};

export const JABAR_BBOX = [106.35, -7.85, 108.85, -5.9];

// ---- Tahap "events": scene Sentinel per kejadian ----
export const EVENTS = {
  windowDays: 120, // jendela pencarian sebelum/sesudah kejadian
  longWindowDays: 365, // jendela diperluas bila lokasi masih berawan di jendela utama
  clearTarget: 5, // % awan LOKAL (di area tampilan) yang dianggap cukup bersih
  maxCloud: 40, // % awan maksimum Sentinel-2 (validasi; pemilihan memakai awan lokal)
  searchDelta: 0.02, // ±~2 km (koordinat kejadian = pusat desa, perkiraan)
};

// ---- Tahap "insar": anomali pergeseran tanah dari COMET-LiCSAR ----
export const LICSAR = {
  list: 'https://gws-access.jasmin.ac.uk/public/nceo_geohazards/LiCSAR_products',
  files: 'https://gws-access.jasmin.ac.uk/public/nceo_geohazards/LiCSAR_products.public',
  archive: 'https://dap.ceda.ac.uk/neodc/comet/data/licsar_products', // interferogram lama
  // Frame yang mencakup Jawa Barat (dicek dari <frame>-poly.txt)
  frames: [
    { id: '098A_09673_121312', track: 98, orbit: 'ascending' },
    { id: '047D_09652_111009', track: 47, orbit: 'descending' },
    { id: '149D_09700_081210', track: 149, orbit: 'descending' },
  ],
};

export const INSAR = {
  methodVersion: 4, // naikkan bila metode berubah → cache dihitung ulang
  baselineStartYear: 2019,
  firstTargetYear: 2021,
  concurrency: 3,
  multilook: 2, // 2×2 → piksel ±220 m
  coherenceMin: 0.3,
  minValidFrac: 0.5, // piksel koheren di ≥50% interferogram
  maxVelocity: 200, // mm/thn; di atas ini hampir pasti galat unwrapping C-band
  highpassRadius: 12, // sel (±2,6 km) → buang atmosfer & ramp
  maxStepMm: 80, // per interferogram
  minDelta: 15, // mm/thn
  zMin: 2.5,
  sdFloor: 4, // mm/thn
  madK: 3, // ambang pencilan spasial (× MAD robust)
  minSpanDays: 150,
  minPixels: 3,
  slopeLandslideDeg: 8, // pin hanya di lereng ≥ ini
  maxPinsPerYear: 40,
  wavelengthMm: 55.465763,
};
