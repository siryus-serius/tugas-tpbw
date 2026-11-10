#!/usr/bin/env node
/**
 * Entrypoint tunggal pipeline data WebGIS Longsor Jabar.
 *
 *   node scripts/pipeline.js [events|insar|all]
 *     --frames 098A_09673_121312,...   batasi frame LiCSAR (tahap insar)
 *     --years 2023-2025                rentang tahun (tahap insar)
 *     --max-pairs 6                    batasi interferogram per tahun (uji cepat)
 *
 * Kelembapan tanah TIDAK diproses di sini: diambil langsung oleh browser dari Open-Meteo
 * agar selalu terkini tanpa commit data harian.
 */
import { runEvents } from './stages/events.js';
import { runInsar } from './stages/insar.js';

const args = process.argv.slice(2);
const stage = args[0] && !args[0].startsWith('--') ? args[0] : 'all';
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : undefined;
};

const [yearFrom, yearTo] = opt('years')?.split('-').map(Number) ?? [];
const insarOptions = {
  frames: opt('frames')?.split(','),
  yearFrom,
  yearTo,
  maxPairs: Number(opt('max-pairs') ?? 0),
};

const STAGES = {
  events: () => runEvents(),
  insar: () => runInsar(insarOptions),
};

const selected = stage === 'all' ? Object.keys(STAGES) : [stage];
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
    console.error(`[-] Tahap ${s} gagal:`, err);
    process.exit(1);
  }
  console.log(`=== ${s} selesai (${((Date.now() - t0) / 1000).toFixed(0)} s) ===`);
}
