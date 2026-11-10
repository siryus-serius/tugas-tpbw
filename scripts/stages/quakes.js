/**
 * Tahap "quakes": riwayat gempa M ≥ 3,5 di sekitar Jawa Barat sejak 2021 dari katalog USGS FDSN
 * (publik, tanpa login). Gempa terkini BMKG diambil langsung oleh browser (feed BMKG ber-CORS).
 * Output: public/data/gempa_usgs.geojson
 */
import fs from 'fs';
import path from 'path';
import { PUBLIC_DATA } from '../config.js';
import { fetchRetry } from '../lib/http.js';
import { round } from '../lib/geo.js';

const FDSN = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const BBOX = { minlatitude: -8.6, maxlatitude: -5.2, minlongitude: 105.6, maxlongitude: 109.6 }; // Jabar ± ~0,8°
export const QUAKES_PATH = path.join(PUBLIC_DATA, 'gempa_usgs.geojson');

export async function runQuakes({ log = console.log, minMagnitude = 3.5, start = '2021-01-01' } = {}) {
  const qs = new URLSearchParams({ format: 'geojson', starttime: start, minmagnitude: minMagnitude, orderby: 'time', ...BBOX });
  const json = await fetchRetry(`${FDSN}?${qs}`);
  const features = json.features.map((f) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [round(f.geometry.coordinates[0], 3), round(f.geometry.coordinates[1], 3)] },
    properties: {
      id: f.id,
      mag: f.properties.mag,
      mag_type: f.properties.magType,
      depth_km: round(f.geometry.coordinates[2], 1),
      time: new Date(f.properties.time).toISOString(),
      place: f.properties.place,
      felt: f.properties.felt,
      url: f.properties.url,
      source: 'USGS',
    },
  }));
  fs.writeFileSync(QUAKES_PATH, JSON.stringify({ type: 'FeatureCollection', generated_at: new Date().toISOString(), features }));
  log(`[✔] ${features.length} gempa M≥${minMagnitude} sejak ${start} → ${path.basename(QUAKES_PATH)}`);
}
