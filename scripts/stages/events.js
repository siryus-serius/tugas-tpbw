/**
 * Tahap "events": per kejadian longsor →
 *  - scene Sentinel-2 L2A paling sedikit awan sebelum & sesudah (warna asli / NDVI)
 *  - pasangan Sentinel-1 RTC sebelum & sesudah pada orbit yang sama
 *  - kemiringan lereng sekitar titik (Copernicus DEM 90 m) → input Faktor Keamanan di frontend
 * Output: public/data/sentinel_events.json
 */
import fs from 'fs';
import path from 'path';
import { EVENTS, PATHS, ROOT } from '../config.js';
import { DAY, bboxAround, bestSentinel2, sentinel1Pair } from '../lib/stac.js';
import { slopeAroundPoint } from '../lib/terrain.js';

export async function runEvents({ log = console.log } = {}) {
  const events = JSON.parse(fs.readFileSync(PATHS.events, 'utf-8')).features;
  const { windowDays, maxCloud, searchDelta } = EVENTS;
  const out = { generated_at: new Date().toISOString(), window_days: windowDays, max_cloud: maxCloud, events: {} };
  // Kemiringan lereng statis → pakai ulang hasil sebelumnya, hemat kuota Elevation API
  const previous = fs.existsSync(PATHS.eventsOut) ? JSON.parse(fs.readFileSync(PATHS.eventsOut, 'utf-8')).events : {};
  let failures = 0;
  let lastTerrainCall = 0;
  // Elevation API menghitung tiap koordinat sebagai 1 panggilan (81/titik); jeda agar < 600/menit
  const terrainFor = async (lng, lat, no) => {
    const cached = previous[no]?.terrain;
    if (cached?.aspect_deg != null) return cached;
    const wait = lastTerrainCall + 9000 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastTerrainCall = Date.now();
    return slopeAroundPoint(lng, lat).catch((err) => (log(`    [-] lereng #${no}: ${err.message}`), null));
  };

  for (const f of events) {
    const p = f.properties;
    const [lng, lat] = f.geometry.coordinates;
    const eventMs = Date.parse(`${p.tanggal}T00:00:00+07:00`);
    const bbox = bboxAround(lng, lat, searchDelta);
    const cover = bboxAround(lng, lat, 0.025); // area tampilan perbandingan besar (±0,024°)
    try {
      const [pre, post, s1, terrain] = await Promise.all([
        bestSentinel2(bbox, eventMs - windowDays * DAY, eventMs - DAY, maxCloud, cover),
        bestSentinel2(bbox, eventMs + DAY, eventMs + windowDays * DAY, maxCloud, cover),
        sentinel1Pair(bbox, eventMs, windowDays),
        terrainFor(lng, lat, p.no),
      ]);
      out.events[p.no] = { s2: { pre, post }, s1, terrain };
      log(
        `[+] #${p.no} ${p.kecamatan}: S2 ${pre?.cloud ?? '-'}%/${post?.cloud ?? '-'}%` +
          ` | S1 ${s1 ? `${s1.gap_days} hari` : '-'} | lereng ${terrain?.slope_deg ?? '-'}° arah ${terrain?.aspect_deg ?? '-'}°`
      );
    } catch (err) {
      failures++;
      log(`[-] #${p.no} ${p.kecamatan}: ${err.message}`);
    }
  }

  if (failures === events.length) throw new Error('Semua pencarian scene gagal; file tidak ditulis.');
  fs.writeFileSync(PATHS.eventsOut, JSON.stringify(out, null, 1));
  log(`[✔] ${path.relative(ROOT, PATHS.eventsOut)}`);
}
