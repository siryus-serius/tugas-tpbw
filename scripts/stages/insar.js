/**
 * Tahap "insar": anomali pergeseran tanah dari interferogram Sentinel-1 COMET-LiCSAR.
 *
 *  1. Per frame & tahun: kecepatan LOS (mm/thn) dengan stacking rantai interferogram berurutan
 *     (di-cache di data/insar/cache; tahun lama tidak dihitung ulang).
 *  2. Δv tahun target vs rata-rata tahun sebelumnya → klaster piksel anomali di lereng → pin.
 *  3. Peta warna Δv per frame/tahun (PNG transparan).
 * Output: public/data/insar/{anomalies.geojson, summary.json, <frame>_<tahun>.png}
 */
import fs from 'fs';
import path from 'path';
import { INSAR, LICSAR, PATHS } from '../config.js';
import { pool } from '../lib/http.js';
import { chainForYear, listPairs, readFrameDem, readFrameGeometry, readPairTif } from '../lib/licsar.js';
import { circularMean, downslopeProjection } from '../lib/motion.js';
import {
  anomalyClusters,
  anomalyGrid,
  cellCenter,
  makeGrid,
  overlayBounds,
  pairDisplacement,
  terrainFromDem,
} from '../lib/raster.js';
import { renderDeltaPNG } from '../lib/png.js';
import { distKm, findRegion, round } from '../lib/geo.js';
import { bboxAround, bestSentinel2OfYear } from '../lib/stac.js';

const severity = (d) => (Math.abs(d) >= 50 ? 'sangat tinggi' : Math.abs(d) >= 30 ? 'tinggi' : 'sedang');

/** Kecepatan tahunan per piksel (dengan cache). Mengisi ctx.grid bila belum ada. */
async function yearlyVelocity(frame, pairs, year, ctx, { maxPairs, log }) {
  const dir = path.join(PATHS.insarCache, frame.id);
  const metaPath = path.join(dir, `${year}.json`);
  const binPath = path.join(dir, `${year}.bin`);
  let { chain, available } = chainForYear(pairs, year);
  if (maxPairs) chain = chain.slice(0, maxPairs);

  if (fs.existsSync(metaPath) && fs.existsSync(binPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    if (meta.method === INSAR.methodVersion && meta.pairs_available >= available && meta.max_pairs === maxPairs) {
      ctx.grid ??= meta.grid;
      const buf = fs.readFileSync(binPath);
      log(`    ${year}: cache (${meta.pairs_used} pasangan)`);
      return { v: new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4), meta };
    }
  }
  if (chain.length < 4) {
    log(`    ${year}: dilewati (hanya ${chain.length} pasangan)`);
    return null;
  }
  for (const p of chain) {
    if (ctx.grid) break;
    ctx.grid = await readPairTif(frame, p.id, 'geo.unw.tif').then(makeGrid, () => null);
  }
  if (!ctx.grid) return null;

  const { grid } = ctx;
  const n = grid.w * grid.h;
  const sumD = new Float32Array(n);
  const sumT = new Float32Array(n);
  const cnt = new Uint16Array(n);
  let used = 0;
  const t0 = Date.now();

  await pool(chain, INSAR.concurrency, async (pair) => {
    let d;
    try {
      const [unw, cc] = await Promise.all([
        readPairTif(frame, pair.id, 'geo.unw.tif'),
        readPairTif(frame, pair.id, 'geo.cc.tif'),
      ]);
      d = pairDisplacement(unw, cc, grid);
    } catch (err) {
      log(`      [-] ${pair.id}: ${err.message}`);
      return;
    }
    if (!d) return;
    const dt = pair.days / 365.25;
    for (let i = 0; i < n; i++) {
      if (!Number.isNaN(d[i])) {
        sumD[i] += d[i];
        sumT[i] += dt;
        cnt[i]++;
      }
    }
    used++;
  });

  const minCount = Math.max(4, Math.ceil(INSAR.minValidFrac * used));
  const v = new Float32Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (cnt[i] < minCount || sumT[i] <= 0) continue;
    const vel = sumD[i] / sumT[i];
    if (Math.abs(vel) <= INSAR.maxVelocity) v[i] = vel;
  }
  const first = chain[0] && new Date(chain[0].t1).toISOString().slice(0, 10);
  const last = chain.at(-1) && new Date(chain.at(-1).t2).toISOString().slice(0, 10);
  const meta = {
    method: INSAR.methodVersion,
    year,
    pairs_used: used,
    pairs_available: available,
    max_pairs: maxPairs,
    first,
    last,
    span_days: first ? (Date.parse(last) - Date.parse(first)) / 86400000 : 0,
    grid,
    computed_at: new Date().toISOString(),
  };
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(binPath, Buffer.from(v.buffer));
  fs.writeFileSync(metaPath, JSON.stringify(meta));
  log(`    ${year}: ${used}/${chain.length} pasangan diproses (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  return { v, meta };
}

/** Satu klaster piksel → Feature GeoJSON pin anomali (atau null bila di luar Jabar). */
function clusterToFeature(px, { frame, grid, Y, years, delta, z, base, terrain, geometry, adm, events }) {
  let peak = px[0];
  let sumD = 0;
  let sumB = 0;
  const slopes = [];
  const aspects = [];
  for (const i of px) {
    if (Math.abs(delta[i]) > Math.abs(delta[peak])) peak = i;
    sumD += delta[i];
    sumB += base[i];
    if (terrain && !Number.isNaN(terrain.slope[i]) && !Number.isNaN(terrain.aspect[i])) {
      slopes.push(terrain.slope[i]);
      aspects.push(terrain.aspect[i]);
    }
  }
  const meanSlope = slopes.length ? slopes.reduce((a, b) => a + b, 0) / slopes.length : null;
  const meanAspect = slopes.length ? circularMean(aspects, slopes) : null; // bobot = kemiringan
  const velocity = years[Y].v[peak];
  // Asumsi gerak searah lereng turun → proyeksi ke LOS & kecepatan searah lereng
  const proj =
    meanSlope !== null && geometry ? downslopeProjection(meanAspect, meanSlope, geometry) : null;
  const usable = proj !== null && Math.abs(proj) >= 0.2; // geometri terlalu tegak lurus → tak bisa diinversi
  const [lng, lat] = cellCenter(grid, peak);
  const wilayah = findRegion(adm, lng, lat);
  if (!wilayah) return null;
  const pxKm2 = Math.abs(grid.dlon) * 111.32 * Math.cos((lat * Math.PI) / 180) * Math.abs(grid.dlat) * 110.57;
  const meanD = sumD / px.length;
  const near = events
    .map((e) => ({ e, d: distKm(e.geometry.coordinates, [lng, lat]) }))
    .filter((x) => x.d <= 3)
    .sort((a, b) => a.d - b.d)[0];
  const yearsList = Object.keys(years).map(Number);
  return {
    score: Math.abs(meanD) * Math.sqrt(px.length),
    feature: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [round(lng, 4), round(lat, 4)] },
      properties: {
        id: `${frame.id}-${Y}-${peak}`,
        year: Y,
        baseline_years: `${Math.min(...yearsList)}–${Y - 1}`,
        frame: frame.id,
        orbit: frame.orbit,
        wilayah,
        delta_mm_yr: round(meanD),
        peak_delta_mm_yr: round(delta[peak]),
        velocity_mm_yr: round(years[Y].v[peak]),
        baseline_mm_yr: round(sumB / px.length),
        z_score: round(z[peak]),
        area_ha: Math.round(px.length * pxKm2 * 100),
        slope_deg: meanSlope === null ? null : round(meanSlope),
        aspect_deg: meanAspect === null ? null : Math.round(meanAspect),
        los_heading: geometry ? round(geometry.heading) : null,
        los_incidence: geometry ? round(geometry.incidence) : null,
        downslope_projection: proj === null ? null : round(proj, 2),
        // konsisten bila tanda LOS sama dengan tanda proyeksi gerak searah lereng
        konsisten_lereng: usable ? Math.sign(velocity) === Math.sign(proj) : null,
        v_downslope_mm_yr: usable && Math.sign(velocity) === Math.sign(proj) ? round(velocity / proj) : null,
        severity: severity(meanD),
        arah: meanD < 0 ? 'menjauhi satelit (penurunan / gerakan lereng)' : 'mendekati satelit (pengangkatan)',
        periode: `${years[Y].meta.first} s.d. ${years[Y].meta.last}`,
        dekat_kejadian: near ? `#${near.e.properties.no} ${near.e.properties.kecamatan} (${near.d.toFixed(1)} km)` : null,
      },
    },
  };
}

export async function runInsar({ frames: frameIds, yearFrom, yearTo, maxPairs = 0, log = console.log } = {}) {
  const adm = JSON.parse(fs.readFileSync(PATHS.adm, 'utf-8'));
  const events = JSON.parse(fs.readFileSync(PATHS.events, 'utf-8')).features;
  const frames = frameIds ? LICSAR.frames.filter((f) => frameIds.includes(f.id)) : LICSAR.frames;
  yearFrom ??= INSAR.baselineStartYear;
  yearTo ??= new Date().getUTCFullYear();
  fs.mkdirSync(PATHS.insarOut, { recursive: true });

  const summary = {
    generated_at: new Date().toISOString(),
    source: 'COMET-LiCSAR Sentinel-1 interferograms (publik)',
    params: INSAR,
    frames: [],
    overlays: [],
  };
  const candidates = [];

  for (const frame of frames) {
    log(`\n[*] Frame ${frame.id} (${frame.orbit})`);
    const pairs = await listPairs(frame);
    log(`    ${pairs.length} interferogram tersedia`);
    const ctx = {};
    const years = {};
    for (let y = yearFrom; y <= yearTo; y++) {
      const r = await yearlyVelocity(frame, pairs, y, ctx, { maxPairs, log });
      if (r && r.meta.span_days >= INSAR.minSpanDays) years[y] = r;
      else if (r) log(`    ${y}: cakupan ${Math.round(r.meta.span_days)} hari < ${INSAR.minSpanDays}, tidak dipakai`);
    }
    summary.frames.push({
      id: frame.id,
      orbit: frame.orbit,
      years: Object.fromEntries(
        Object.entries(years).map(([y, r]) => [y, { pairs: r.meta.pairs_used, first: r.meta.first, last: r.meta.last }])
      ),
    });
    const { grid } = ctx;
    if (!grid) continue;
    const geometry = await readFrameGeometry(frame).catch(() => null);
    const terrain = await readFrameDem(frame).then(
      (dem) => terrainFromDem(dem, grid),
      (err) => (log(`    [-] DEM tidak terbaca: ${err.message}`), null)
    );

    for (const Y of Object.keys(years).map(Number)) {
      if (Y < INSAR.firstTargetYear) continue;
      const baseline = Object.keys(years).map(Number).filter((y) => y < Y).map((y) => years[y].v);
      if (baseline.length < 2) continue;
      const { delta, z, base } = anomalyGrid(years[Y].v, baseline);

      const png = `${frame.id}_${Y}.png`;
      fs.writeFileSync(path.join(PATHS.insarOut, png), renderDeltaPNG(grid, delta, INSAR.minDelta));
      summary.overlays.push({ frame: frame.id, orbit: frame.orbit, year: Y, url: `data/insar/${png}`, bounds: overlayBounds(grid) });

      for (const px of anomalyClusters(grid, delta, z, terrain?.slope)) {
        const c = clusterToFeature(px, { frame, grid, Y, years, delta, z, base, terrain, geometry, adm, events });
        if (c) candidates.push(c);
      }
    }
  }

  // Batasi pin per tahun, lalu cari citra Sentinel-2 pembanding (tahun sebelum vs tahun anomali)
  const byYear = new Map();
  for (const { feature } of candidates.sort((a, b) => b.score - a.score)) {
    const y = feature.properties.year;
    if (!byYear.has(y)) byYear.set(y, []);
    if (byYear.get(y).length < INSAR.maxPinsPerYear) byYear.get(y).push(feature);
  }
  const features = [...byYear.values()].flat();
  log(`\n[*] ${features.length} pin anomali; mencari citra Sentinel-2 pembanding...`);
  await pool(features, 4, async (f) => {
    const bbox = bboxAround(...f.geometry.coordinates, 0.017);
    const Y = f.properties.year;
    const [pre, post] = await Promise.all([bestSentinel2OfYear(bbox, Y - 1), bestSentinel2OfYear(bbox, Y)]).catch(() => []);
    f.properties.s2_pre = pre?.id ?? null;
    f.properties.s2_post = post?.id ?? null;
  });

  fs.writeFileSync(path.join(PATHS.insarOut, 'anomalies.geojson'), JSON.stringify({ type: 'FeatureCollection', features }));
  summary.anomaly_years = [...byYear.keys()].sort();
  summary.counts = Object.fromEntries([...byYear].map(([y, l]) => [y, l.length]));
  fs.writeFileSync(path.join(PATHS.insarOut, 'summary.json'), JSON.stringify(summary, null, 1));
  log(`[✔] Anomali per tahun: ${JSON.stringify(summary.counts)}`);
}
