#!/usr/bin/env node
/**
 * Entrypoint tunggal pipeline data WebGIS Longsor Jabar.
 *
 *   node scripts/pipeline.js [events|insar|quakes|galura|validate|ingest|gee-check|all] [opsi]
 *     --monthly                        gerbang bulanan: lewati semua bila bulan (WIB) belum berganti
 *     --force                          abaikan gerbang bulanan
 *     --no-links                       validasi tanpa cek tautan sumber (offline)
 *     --frames 098A_09673_121312,...   batasi frame LiCSAR (tahap insar)
 *     --years 2023-2025                rentang tahun (tahap insar)
 *     --max-pairs 6                    batasi interferogram per tahun (uji cepat)
 *
 * "all" = events → insar → quakes → galura → validate. Validasi gagal → exit 1 → workflow tidak commit.
 * Gempa terkini BMKG diambil langsung oleh browser; riwayat gempa USGS diproses di tahap quakes.
 */
import fs from 'fs';
import path from 'path';
import { PUBLIC_DATA } from './config.js';
import { runEvents } from './stages/events.js';
import { runGalura } from './stages/galura.js';
import { runGeeCheck } from './stages/geeCheck.js';
import { runIngest } from './stages/ingest.js';
import { runInsar } from './stages/insar.js';
import { runQuakes } from './stages/quakes.js';
import { runRefineCoords } from './stages/refineCoords.js';
import { currentMonth, runValidate } from './stages/validate.js';

const args = process.argv.slice(2);
const stage = args[0] && !args[0].startsWith('--') ? args[0] : 'all';
const has = (flag) => args.includes(`--${flag}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : undefined;
};

/** Tulis output step GitHub Actions (bila berjalan di Actions). */
const setOutput = (key, value) => {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
};

// ---- Gerbang bulanan ----
if (has('monthly') && !has('force')) {
  const prev = path.join(PUBLIC_DATA, 'validation.json');
  const lastMonth = fs.existsSync(prev) ? JSON.parse(fs.readFileSync(prev, 'utf-8')).data_month : null;
  if (lastMonth === currentMonth()) {
    console.log(`[=] Data bulan ${lastMonth} sudah ada; bulan belum berganti → tidak ada pembaruan/upload.`);
    setOutput('updated', 'false');
    process.exit(0);
  }
  console.log(`[*] Bulan baru (${lastMonth ?? 'belum ada'} → ${currentMonth()}): jalankan pembaruan.`);
}

const [yearFrom, yearTo] = opt('years')?.split('-').map(Number) ?? [];
const STAGES = {
  events: () => runEvents(),
  insar: () => runInsar({ frames: opt('frames')?.split(','), yearFrom, yearTo, maxPairs: Number(opt('max-pairs') ?? 0) }),
  quakes: () => runQuakes(),
  galura: () => runGalura(),
  validate: () => runValidate({ checkLinks: !has('no-links') }),
  ingest: () => runIngest(),
  'refine-coords': () => runRefineCoords({ dry: has('dry') }),
  'gee-check': () => runGeeCheck(),
};
const ALL = ['events', 'insar', 'quakes', 'galura', 'validate']; // ingest, refine-coords & gee-check dijalankan eksplisit

const selected = stage === 'all' ? ALL : [stage];
if (!selected.every((s) => STAGES[s])) {
  console.error(`Tahap tidak dikenal: ${stage}. Pilihan: ${Object.keys(STAGES).join(', ')}, all`);
  process.exit(2);
}

for (const s of selected) {
  console.log(`\n=== Tahap: ${s} ===`);
  const t0 = Date.now();
  try {
    await STAGES[s]();
  } catch (err) {
    console.error(`[-] Tahap ${s} gagal:`, err.message ?? err);
    setOutput('updated', 'false');
    process.exit(1);
  }
  console.log(`=== ${s} selesai (${((Date.now() - t0) / 1000).toFixed(0)} s) ===`);
}
setOutput('updated', 'true');
