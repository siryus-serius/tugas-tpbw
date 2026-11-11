/**
 * Tahap "galura": rekap kejadian TANAH LONGSOR per desa/kelurahan dari Galura Data Jabar
 * (Open Data Provinsi Jawa Barat; produsen: Dinas Pemberdayaan Masyarakat dan Desa).
 *
 *   data/sources/galura/idm_jml_kejadian_bencana_tanah_longsor__des_kel.csv   (unduhan resmi, di-commit)
 *     → public/data/galura_longsor.json   (jumlah per kabupaten & kecamatan per tahun)
 *
 * Server Galura menolak akses non-browser, jadi CSV diunduh manual dari halaman dataset
 * (tombol Unduh → CSV) saat ada rilis baru (dataset tahunan), lalu disimpan di path di atas.
 * Tahap ini sepenuhnya offline sehingga berjalan otomatis di GitHub Actions setiap bulan.
 */
import fs from 'fs';
import path from 'path';
import { PATHS, PUBLIC_DATA, ROOT } from '../config.js';

export const GALURA = {
  csv: path.join(ROOT, 'data', 'sources', 'galura', 'idm_jml_kejadian_bencana_tanah_longsor__des_kel.csv'),
  out: path.join(PUBLIC_DATA, 'galura_longsor.json'),
  url: 'https://galura.jabarprov.go.id/dataset/jumlah-kejadian-bencana-tanah-longsor-berdasarkan-desakelurahan-di-jawa-barat',
};

/** "KABUPATEN BANDUNG BARAT" → "Bandung Barat", "KOTA BANJAR" → "Kota Banjar" (= shapeName jabar-adm.json). */
export const galuraKabKey = (nama) => {
  const title = nama
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase())
    .trim();
  return title.replace(/^Kabupaten\s+/, '');
};

const titleCase = (s) => s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

export async function runGalura({ log = console.log } = {}) {
  if (!fs.existsSync(GALURA.csv)) {
    log(`[!] ${path.relative(ROOT, GALURA.csv)} tidak ada — lewati (unduh dari ${GALURA.url}).`);
    return;
  }
  const lines = fs.readFileSync(GALURA.csv, 'utf-8').replace(/^﻿/, '').trim().split(/\r?\n/);
  const head = lines[0].split(',');
  const col = (k) => {
    const i = head.indexOf(k);
    if (i < 0) throw new Error(`Kolom "${k}" tidak ada di CSV Galura`);
    return i;
  };
  const C = {
    kabKode: col('bps_kode_kabupaten_kota'),
    kab: col('bps_nama_kabupaten_kota'),
    kecKode: col('kemendagri_kode_kecamatan'),
    kec: col('kemendagri_nama_kecamatan'),
    n: col('jumlah_kejadian'),
    tahun: col('tahun'),
  };

  const adm = JSON.parse(fs.readFileSync(PATHS.adm, 'utf-8'));
  const shapes = new Set(adm.features.map((f) => f.properties.shapeName));
  const kab = {};
  const years = new Set();
  let rows = 0;
  for (const line of lines.slice(1)) {
    const r = line.split(',');
    if (r.length !== head.length) throw new Error(`Baris CSV tidak valid: ${line.slice(0, 80)}`);
    const n = Number(r[C.n]);
    const y = Number(r[C.tahun]);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(y)) throw new Error(`Nilai tidak valid: ${line.slice(0, 80)}`);
    rows++;
    years.add(y);
    const key = galuraKabKey(r[C.kab]);
    const k = (kab[key] ??= { kode: r[C.kabKode], nama: titleCase(r[C.kab]), tahun: {}, kecamatan: {} });
    k.tahun[y] = (k.tahun[y] ?? 0) + n;
    if (!n) continue;
    const kc = (k.kecamatan[r[C.kecKode]] ??= { nama: titleCase(r[C.kec]), tahun: {} });
    kc.tahun[y] = (kc.tahun[y] ?? 0) + n;
  }

  const unmatched = Object.keys(kab).filter((k) => !shapes.has(k));
  if (unmatched.length) throw new Error(`Kab/kota Galura tidak cocok dengan batas wilayah: ${unmatched.join(', ')}`);

  const ys = [...years].sort((a, b) => a - b);
  const out = {
    sumber: {
      nama: 'Galura Data Jabar — Jumlah Kejadian Bencana Tanah Longsor Berdasarkan Desa/Kelurahan di Jawa Barat',
      produsen: 'Dinas Pemberdayaan Masyarakat dan Desa Provinsi Jawa Barat',
      url: GALURA.url,
    },
    diproses: new Date().toISOString(),
    periode: [ys[0], ys.at(-1)],
    catatan:
      'Jumlah kejadian longsor yang dilaporkan desa (Indeks Desa Membangun). Kota yang wilayahnya kelurahan (mis. Kota Bandung, Bogor, Depok) tidak tercakup.',
    baris_sumber: rows,
    kabupaten: kab,
  };
  fs.writeFileSync(GALURA.out, JSON.stringify(out));
  const total = Object.values(kab).reduce((s, k) => s + Object.values(k.tahun).reduce((a, b) => a + b, 0), 0);
  log(`[✔] Galura ${ys[0]}–${ys.at(-1)}: ${total} kejadian, ${Object.keys(kab).length} kab/kota → ${path.relative(ROOT, GALURA.out)}`);
}
