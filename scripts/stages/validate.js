/**
 * Tahap "validate": pemeriksaan kevalidan seluruh data sebelum boleh di-upload.
 * Status per pemeriksaan: pass | warn | fail | info. Ada "fail" → pipeline gagal → tidak ada commit.
 * Output: public/data/validation.json (ditampilkan di menu "Validasi Data").
 */
import fs from 'fs';
import path from 'path';
import { EVENTS, INSAR, PATHS, PUBLIC_DATA } from '../config.js';
import { findRegion } from '../lib/geo.js';
import { pool } from '../lib/http.js';

const OFFICIAL = /(bnpb\.go\.id|bpbd|jabarprov\.go\.id|\.go\.id|antaranews\.com)/i;
const REQUIRED = ['no', 'kabupaten', 'kecamatan', 'tanggal', 'tahun', 'korban_meninggal', 'sumber', 'tautan_sumber', 'jenis_koordinat'];
const today = () => new Date().toISOString().slice(0, 10);
export const currentMonth = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).format(new Date());

const normKab = (s) => s.replace(/^Kabupaten\s+/i, '').trim().toLowerCase();
const readJson = (p, fallback = null) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : fallback);
const label = (p) => `#${p.no} ${p.kecamatan} (${p.tanggal})`;

function check(id, group, title, items, { failLevel = 'fail', okDetail, info = false } = {}) {
  const status = info ? 'info' : items.length ? failLevel : 'pass';
  return { id, group, title, status, detail: items.length ? `${items.length} temuan` : okDetail ?? 'Semua lolos', items };
}

async function linkStatus(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'WebGIS-Longsor-Jabar-Validator/1.0' },
    });
    return res.status;
  } catch (err) {
    return err.name === 'TimeoutError' ? 'timeout' : 'error';
  }
}

export async function runValidate({ log = console.log, checkLinks = true } = {}) {
  const adm = readJson(PATHS.adm);
  const events = readJson(PATHS.events).features;
  const scenes = readJson(PATHS.eventsOut, { events: {} }).events;
  const summary = readJson(path.join(PATHS.insarOut, 'summary.json'));
  const anomalies = readJson(path.join(PATHS.insarOut, 'anomalies.geojson'), { features: [] }).features;
  const checks = [];

  // ---------- A. Kejadian longsor ----------
  const P = events.map((f) => ({ ...f.properties, coord: f.geometry?.coordinates }));
  checks.push(
    check('ev-schema', 'Kejadian longsor', 'Kolom wajib terisi', P.filter((p) => REQUIRED.some((k) => p[k] == null || p[k] === '')).map(
      (p) => `${label(p)}: kosong → ${REQUIRED.filter((k) => p[k] == null || p[k] === '').join(', ')}`
    ))
  );
  checks.push(
    check('ev-date', 'Kejadian longsor', 'Tanggal valid (2021 s.d. hari ini) & cocok dengan kolom tahun', P.filter((p) => {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(p.tanggal) && !Number.isNaN(Date.parse(p.tanggal));
      return !ok || p.tanggal < '2021-01-01' || p.tanggal > today() || Number(p.tanggal.slice(0, 4)) !== p.tahun;
    }).map(label))
  );
  checks.push(
    check('ev-inside', 'Kejadian longsor', 'Koordinat berada di dalam Jawa Barat', P.filter((p) => p.coord && !findRegion(adm, ...p.coord)).map(label))
  );
  // Kejadian tanpa koordinat sah (dicantumkan di tingkat kabupaten/kota) → hanya peringatan agar bisa dilengkapi
  checks.push(
    check('ev-nocoord', 'Kejadian longsor', 'Kejadian memiliki koordinat', P.filter((p) => !p.coord).map((p) => `${label(p)}: hanya tingkat kabupaten/kota`), {
      failLevel: 'warn',
    })
  );
  checks.push(
    check(
      'ev-kab',
      'Kejadian longsor',
      'Koordinat jatuh di kabupaten/kota yang tercatat',
      P.filter((p) => p.coord && findRegion(adm, ...p.coord))
        .filter((p) => normKab(findRegion(adm, ...p.coord)) !== normKab(p.kabupaten))
        .map((p) => `${label(p)}: tercatat ${p.kabupaten}, koordinat di ${findRegion(adm, ...p.coord)}`),
      { failLevel: 'warn' }
    )
  );
  const seen = new Map();
  const dups = [];
  for (const p of P) {
    const k = `${p.tanggal}|${normKab(p.kabupaten)}|${String(p.kecamatan).toLowerCase()}`;
    if (seen.has(k)) dups.push(`${label(p)} = #${seen.get(k)}`);
    else seen.set(k, p.no);
  }
  checks.push(check('ev-dup', 'Kejadian longsor', 'Tidak ada kejadian ganda', dups));
  checks.push(
    check('ev-src2', 'Kejadian longsor', 'Minimal 2 sumber independen', P.filter((p) => (p.tautan_sumber?.length ?? 0) < 2).map(label), {
      failLevel: 'warn',
    })
  );
  checks.push(
    check('ev-official', 'Kejadian longsor', 'Ada sumber resmi (BNPB/BPBD/pemerintah/ANTARA)', P.filter((p) => !p.tautan_sumber?.some((u) => OFFICIAL.test(u))).map(label), {
      failLevel: 'warn',
    })
  );

  if (checkLinks) {
    const urls = [...new Set(P.flatMap((p) => p.tautan_sumber || []))];
    log(`[*] Memeriksa ${urls.length} tautan sumber...`);
    const status = new Map();
    await pool(urls, 6, async (u) => status.set(u, await linkStatus(u)));
    const broken = P.flatMap((p) =>
      (p.tautan_sumber || []).filter((u) => !(typeof status.get(u) === 'number' && status.get(u) < 400)).map((u) => `${label(p)}: ${status.get(u)} ${u}`)
    );
    // 403/timeout sering karena situs berita memblokir bot → peringatan, bukan gagal
    checks.push(check('ev-links', 'Kejadian longsor', 'Tautan sumber dapat diakses', broken, { failLevel: 'warn' }));
  }

  // ---------- B. Citra Sentinel per kejadian ----------
  const sceneIssues = [];
  const s1Issues = [];
  const terrainIssues = [];
  for (const p of P.filter((x) => x.coord)) {
    const s = scenes[p.no];
    const t = Date.parse(`${p.tanggal}T00:00:00+07:00`);
    if (!s) {
      sceneIssues.push(`${label(p)}: belum dicari`);
      continue;
    }
    if (!s.s2?.pre || Date.parse(s.s2.pre.datetime) >= t) sceneIssues.push(`${label(p)}: scene S2 sebelum tidak ada/tidak valid`);
    if (!s.s2?.post || Date.parse(s.s2.post.datetime) < t) sceneIssues.push(`${label(p)}: scene S2 sesudah tidak ada/tidak valid`);
    for (const k of ['pre', 'post']) if (s.s2?.[k] && s.s2[k].cloud > EVENTS.maxCloud) sceneIssues.push(`${label(p)}: awan S2 ${k} ${s.s2[k].cloud}%`);
    if (!s.s1 || Date.parse(s.s1.pre.datetime) >= t || Date.parse(s.s1.post.datetime) < t) s1Issues.push(label(p));
    if (s.terrain?.slope_deg == null || s.terrain?.aspect_deg == null) terrainIssues.push(label(p));
  }
  checks.push(check('sc-s2', 'Citra Sentinel', `Sentinel-2 sebelum & sesudah, awan ≤ ${EVENTS.maxCloud}%`, sceneIssues, { failLevel: 'warn' }));
  checks.push(check('sc-s1', 'Citra Sentinel', 'Pasangan Sentinel-1 orbit sama mengapit tanggal kejadian', s1Issues, { failLevel: 'warn' }));
  checks.push(check('sc-terrain', 'Citra Sentinel', 'Kemiringan & arah lereng tersedia', terrainIssues, { failLevel: 'warn' }));

  // ---------- C. InSAR ----------
  const missingPng = (summary?.overlays || []).filter((o) => !fs.existsSync(path.join(PUBLIC_DATA, o.url.replace(/^data\//, '')))).map((o) => o.url);
  checks.push(check('in-files', 'InSAR', 'Ringkasan & seluruh overlay tersedia', summary ? missingPng : ['summary.json tidak ada']));
  const ids = new Set();
  const badAnom = [];
  for (const f of anomalies) {
    const p = f.properties;
    if (!findRegion(adm, ...f.geometry.coordinates)) badAnom.push(`${p.id}: di luar Jawa Barat`);
    if (p.slope_deg != null && p.slope_deg < INSAR.slopeLandslideDeg - 0.5) badAnom.push(`${p.id}: lereng ${p.slope_deg}°`);
    if (Math.abs(p.delta_mm_yr) < INSAR.minDelta * 0.5) badAnom.push(`${p.id}: Δv ${p.delta_mm_yr}`);
    if (ids.has(p.id)) badAnom.push(`${p.id}: ID ganda`);
    ids.add(p.id);
  }
  checks.push(check('in-anom', 'InSAR', 'Pin anomali memenuhi kriteria (di Jabar, lereng, ambang Δv, ID unik)', badAnom));
  const cons = { true: 0, false: 0, null: 0 };
  anomalies.forEach((f) => cons[f.properties.konsisten_lereng ?? null]++);
  checks.push({
    id: 'in-consistency',
    group: 'InSAR',
    title: 'Konsistensi arah sinyal dengan gerak searah lereng',
    status: 'info',
    detail: `${cons.true} konsisten · ${cons.false} tidak konsisten · ${cons.null} tak dapat dipastikan (dari ${anomalies.length})`,
    items: [],
  });
  const gaps = [];
  const nowYear = new Date().getUTCFullYear();
  for (const fr of summary?.frames || []) {
    for (let y = INSAR.baselineStartYear; y <= nowYear; y++) if (!fr.years[y]) gaps.push(`${fr.id} (${fr.orbit}): ${y} tidak tersedia/terlalu pendek`);
  }
  checks.push({ id: 'in-coverage', group: 'InSAR', title: 'Cakupan data per frame & tahun', status: gaps.length ? 'warn' : 'pass', detail: gaps.length ? `${gaps.length} celah data` : 'Lengkap', items: gaps });

  // ---------- D. Gempa ----------
  const quakes = readJson(path.join(PUBLIC_DATA, 'gempa_usgs.geojson'), null);
  const qIssues = !quakes
    ? ['gempa_usgs.geojson tidak ada']
    : quakes.features.filter((f) => !f.properties.id || !(f.properties.mag >= 0) || Number.isNaN(Date.parse(f.properties.time))).map((f) => f.properties.id ?? '?');
  checks.push(check('eq-catalog', 'Gempa', `Katalog gempa USGS valid (${quakes?.features.length ?? 0} gempa)`, qIssues));

  // ---------- Ringkasan ----------
  const count = (s) => checks.filter((c) => c.status === s).length;
  const report = {
    generated_at: new Date().toISOString(),
    data_month: currentMonth(),
    totals: { events: events.length, anomalies: anomalies.length, quakes: quakes?.features.length ?? 0 },
    summary: { pass: count('pass'), warn: count('warn'), fail: count('fail'), info: count('info') },
    checks,
  };
  fs.writeFileSync(path.join(PUBLIC_DATA, 'validation.json'), JSON.stringify(report, null, 1));
  log(`[✔] Validasi: ${report.summary.pass} lolos · ${report.summary.warn} peringatan · ${report.summary.fail} gagal`);
  for (const c of checks.filter((x) => x.status === 'fail')) log(`    GAGAL ${c.title}: ${c.items.slice(0, 5).join('; ')}`);
  if (report.summary.fail) throw new Error('Validasi gagal — data tidak boleh di-upload.');
  return report;
}
