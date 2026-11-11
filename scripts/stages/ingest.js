/**
 * Tahap "ingest" (manual, ditinjau manusia): gabungkan kandidat kejadian & perbaikan sumber ke GeoJSON.
 *
 *  data/candidates/longsor_kandidat.json      → kejadian baru (wajib ≥ 2 tautan)
 *  data/candidates/perbaikan_kejadian_lama.json → tautan tambahan/pengganti & korban final
 *
 * Koordinat: geocoding Nominatim (OSM) "desa, kecamatan, kabupaten"; bila desa tak ditemukan → pusat
 * kecamatan. Hasil WAJIB jatuh di poligon kabupaten yang sama; bila tidak ditemukan, kejadian tetap
 * dimasukkan TANPA koordinat (geometry null) dan hanya dihitung/didaftar di tingkat kabupaten/kota.
 * Setelah ingest jalankan `validate`.
 */
import fs from 'fs';
import path from 'path';
import { PATHS, ROOT } from '../config.js';
import { findRegion, round } from '../lib/geo.js';

const CAND_DIR = path.join(ROOT, 'data', 'candidates');
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const UA = 'WebGIS-Longsor-Jabar/1.0 (+https://github.com/siryus-serius/tugas-tpbw)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normKab = (s) => s.replace(/^Kabupaten\s+/i, '').trim().toLowerCase();
const clean = (s) => String(s || '').replace(/^(desa|kelurahan|kecamatan)\s+/i, '').trim();

let lastCall = 0;
async function geocode(q) {
  const wait = lastCall + 1100 - Date.now(); // kebijakan Nominatim: ≤ 1 request/detik
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const url = `${NOMINATIM}?format=jsonv2&limit=5&countrycodes=id&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'id' } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  return (await res.json()).map((r) => [Number(r.lon), Number(r.lat)]);
}

/** Koordinat pertama hasil geocoding yang jatuh di kabupaten yang benar. */
async function locate(adm, c) {
  const kab = c.kabupaten.replace(/^Kabupaten\s+/i, '');
  const desa = clean(c.desa) && clean(c.desa) !== '-' ? clean(c.desa) : null;
  const kec = clean(c.kecamatan);
  const tries = [];
  if (desa) {
    tries.push([`${desa}, ${kec}, ${kab}, Jawa Barat`, 'Pusat desa (perkiraan)']);
    tries.push([`${desa}, ${kab}`, 'Pusat desa (perkiraan)']);
  }
  tries.push([`Kecamatan ${kec}, ${kab}, Jawa Barat`, 'Pusat kecamatan (perkiraan)']);
  tries.push([`${kec}, ${kab}, Jawa Barat`, 'Pusat kecamatan (perkiraan)']);
  tries.push([`${kec}, Jawa Barat`, 'Pusat kecamatan (perkiraan)']);
  for (const [q, jenis] of tries) {
    for (const coord of await geocode(q)) {
      const region = findRegion(adm, ...coord);
      if (region && normKab(region) === normKab(c.kabupaten)) return { coord: [round(coord[0], 5), round(coord[1], 5)], jenis };
    }
  }
  return null;
}

export async function runIngest({ log = console.log } = {}) {
  const adm = JSON.parse(fs.readFileSync(PATHS.adm, 'utf-8'));
  const geo = JSON.parse(fs.readFileSync(PATHS.events, 'utf-8'));
  const key = (p) => `${p.tanggal}|${normKab(p.kabupaten)}|${clean(p.kecamatan).toLowerCase()}`;
  const existing = new Set(geo.features.map((f) => key(f.properties)));
  let nextNo = Math.max(...geo.features.map((f) => f.properties.no)) + 1;
  const report = { added: [], rejected: [], fixed: [], noCoord: [] };

  // ---- Perbaikan kejadian lama ----
  const fixPath = path.join(CAND_DIR, 'perbaikan_kejadian_lama.json');
  if (fs.existsSync(fixPath)) {
    for (const fx of JSON.parse(fs.readFileSync(fixPath, 'utf-8'))) {
      const f = geo.features.find((x) => x.properties.no === fx.no);
      if (!f) continue;
      const p = f.properties;
      let links = p.tautan_sumber.map((u) => fx.tautan_mati_pengganti?.[u] ?? u);
      links = [...new Set([...links, ...(fx.tautan_tambahan || [])])];
      p.tautan_sumber = links;
      if (fx.korban_meninggal_final != null) p.korban_meninggal = fx.korban_meninggal_final;
      p.status_verifikasi = `Terverifikasi (${links.length} sumber)`;
      report.fixed.push(`#${p.no} ${p.kecamatan}`);
    }
  }

  // ---- Kejadian baru ----
  const candPath = path.join(CAND_DIR, 'longsor_kandidat.json');
  const candidates = fs.existsSync(candPath) ? JSON.parse(fs.readFileSync(candPath, 'utf-8')) : [];
  for (const c of candidates.sort((a, b) => a.tanggal.localeCompare(b.tanggal))) {
    const name = `${c.kecamatan}, ${c.kabupaten} ${c.tanggal}`;
    if (existing.has(key(c))) {
      report.rejected.push(`${name}: duplikat`);
      continue;
    }
    if ((c.tautan_sumber?.length ?? 0) < 2) {
      report.rejected.push(`${name}: sumber < 2`);
      continue;
    }
    const loc = await locate(adm, c).catch((err) => (log(`    [-] geocoding ${name}: ${err.message}`), null));
    if (!loc) report.noCoord.push(name);
    geo.features.push({
      type: 'Feature',
      geometry: loc ? { type: 'Point', coordinates: loc.coord } : null,
      properties: {
        no: nextNo++,
        kabupaten: c.kabupaten,
        kecamatan: clean(c.kecamatan),
        desa: c.desa && c.desa !== '-' ? `Desa ${clean(c.desa)}` : '-',
        kampung: '-',
        tanggal: c.tanggal,
        tahun: Number(c.tanggal.slice(0, 4)),
        korban_meninggal: c.korban_meninggal ?? 0,
        keterangan: c.keterangan,
        jenis_koordinat: loc ? `${loc.jenis}; geocoding OSM` : 'Tanpa koordinat (tingkat kabupaten/kota)',
        kode_wilayah: '-',
        sumber: c.sumber,
        tautan_sumber: c.tautan_sumber,
        status_verifikasi: `Terverifikasi (${c.tautan_sumber.length} sumber)`,
      },
    });
    existing.add(key(c));
    report.added.push(name);
    log(`[+] ${name} → ${loc ? loc.jenis : 'tanpa koordinat'}`);
  }

  geo.features.sort((a, b) => a.properties.tanggal.localeCompare(b.properties.tanggal));
  fs.writeFileSync(PATHS.events, JSON.stringify(geo, null, 2));
  log(`[✔] Ditambah ${report.added.length} (${report.noCoord.length} tanpa koordinat), diperbaiki ${report.fixed.length}, ditolak ${report.rejected.length}`);
  report.rejected.forEach((r) => log(`    ditolak: ${r}`));
  return report;
}
