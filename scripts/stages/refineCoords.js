/**
 * Tahap "refine-coords" (manual, ditinjau manusia): pertajam koordinat kejadian dari pusat
 * desa/kecamatan ke pusat KAMPUNG/DUSUN yang disebut di berita (kolom `kampung` atau `keterangan`).
 *
 * Geocoding: Nominatim (OpenStreetMap), ≤ 1 permintaan/detik, mencari NAMA KAMPUNG SAJA yang
 * dibatasi kotak di sekitar koordinat lama (±6 km bila titik berbasis desa, ±14 km bila kecamatan).
 * Hasil hanya diterima bila:
 *   - jenis tempat dusun/kampung/permukiman (hamlet/neighbourhood/isolated_dwelling/quarter/
 *     locality/residential) — BUKAN desa lain bernama sama, sekolah, jalan, dsb.,
 *   - nama tempat sama persis dengan nama kampung di berita,
 *   - berada di kabupaten/kota yang sama (poligon jabar-adm.json).
 * Koordinat lama disimpan di `koordinat_awal`; `jenis_koordinat` mencatat sumber baru.
 * Cakupan nama kampung di OSM untuk pedesaan Jabar masih tipis → banyak kejadian tetap di pusat desa.
 *
 *   node scripts/pipeline.js refine-coords [--dry]
 */
import fs from 'fs';
import { PATHS } from '../config.js';
import { distKm, findRegion, round } from '../lib/geo.js';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const UA = 'WebGIS-Longsor-Jabar/1.0 (+https://github.com/siryus-serius/tugas-tpbw)';
const PLACE_TYPES = new Set(['hamlet', 'neighbourhood', 'isolated_dwelling', 'quarter', 'locality', 'residential']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normKab = (s) => s.replace(/^Kabupaten\s+/i, '').trim().toLowerCase();
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

let lastCall = 0;
async function search(q, [lng, lat], d) {
  const wait = lastCall + 1100 - Date.now(); // kebijakan Nominatim: ≤ 1 permintaan/detik
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const box = [lng - d, lat + d, lng + d, lat - d].join(',');
  const url = `${NOMINATIM}?format=jsonv2&limit=8&countrycodes=id&bounded=1&viewbox=${box}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'id' } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  return res.json();
}

/** Nama kampung/dusun dari kolom kampung atau kalimat keterangan berita. */
export function kampungOf(p) {
  const fromField = p.kampung && p.kampung !== '-' ? p.kampung : null;
  const fromText = p.keterangan.match(/\b(?:Kampung|Kp\.|Dusun|Dsn\.)\s+([A-Z][\w']*(?:\s+[A-Z][\w']*)?)/)?.[1];
  const raw = fromField ?? fromText;
  if (!raw) return null;
  const name = raw
    .replace(/^(Kp\.|Kampung|Dsn\.|Dusun)\s*/i, '')
    .replace(/\s*\(.*\)\s*$/, '')
    .trim();
  return /^(ponpes|pondok)/i.test(name) ? null : name;
}

export async function runRefineCoords({ log = console.log, dry = false } = {}) {
  const adm = JSON.parse(fs.readFileSync(PATHS.adm, 'utf-8'));
  const geo = JSON.parse(fs.readFileSync(PATHS.events, 'utf-8'));
  const report = { refined: [], skipped: [] };

  for (const f of geo.features) {
    const p = f.properties;
    if (/kampung|dusun|titik kejadian/i.test(p.jenis_koordinat)) continue; // sudah tajam
    const name = kampungOf(p);
    const old = f.geometry?.coordinates ?? null;
    if (!name || !old) continue;
    const d = /kecamatan/i.test(p.jenis_koordinat) ? 0.13 : 0.055; // ±14 km / ±6 km

    const results = await search(name, old, d).catch((err) => (log(`    [-] ${name}: ${err.message}`), []));
    const hit = results.find((r) => {
      const region = findRegion(adm, Number(r.lon), Number(r.lat));
      return (
        PLACE_TYPES.has(r.addresstype ?? r.type) &&
        norm(r.name ?? '') === norm(name) &&
        region &&
        normKab(region) === normKab(p.kabupaten)
      );
    });

    const label = `#${p.no} ${p.kecamatan}: Kp. ${name}`;
    if (!hit) {
      report.skipped.push(label);
      log(`[=] ${label}: belum ada di OSM / tidak lolos syarat`);
      continue;
    }
    const c = [round(Number(hit.lon), 5), round(Number(hit.lat), 5)];
    report.refined.push(`${label} → ${c.join(', ')} (geser ${distKm(old, c).toFixed(1)} km)`);
    log(`[+] ${label} → ${hit.display_name.split(',').slice(0, 3).join(',')} (geser ${distKm(old, c).toFixed(1)} km)`);
    if (dry) continue;
    p.koordinat_awal = { koordinat: old, jenis: p.jenis_koordinat };
    p.jenis_koordinat = `Pusat kampung/dusun (OSM, nama dari berita); OSM ${hit.osm_type}/${hit.osm_id}`;
    f.geometry = { type: 'Point', coordinates: c };
  }

  if (!dry && report.refined.length) fs.writeFileSync(PATHS.events, JSON.stringify(geo, null, 2));
  log(`[✔] Dipertajam ${report.refined.length}, tetap ${report.skipped.length}${dry ? ' (uji coba, tidak ditulis)' : ''}`);
  return report;
}
