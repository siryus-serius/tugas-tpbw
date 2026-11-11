/**
 * Pencarian scene Sentinel-1 RTC & Sentinel-2 L2A di Microsoft Planetary Computer (tanpa login).
 * Hanya ID scene yang disimpan; gambar di-render on-the-fly oleh PC Data API di frontend.
 */
import { geometryCoversBbox } from './geo.js';
import { pool, postJson } from './http.js';

const STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const PC_STATS = 'https://planetarycomputer.microsoft.com/api/data/v1/item/statistics';
export const DAY = 86400000;
export const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
export const bboxAround = (lng, lat, delta) => [lng - delta, lat - delta, lng + delta, lat + delta];

const search = async (body) => (await postJson(STAC_SEARCH, body)).features || [];

/**
 * Scene Sentinel-2 L2A paling sedikit awan dalam rentang waktu yang MENUTUPI seluruh area tampilan
 * (scene di tepi petak/swath sering hanya menutupi sebagian → citra terpotong/kosong).
 * coverBbox: area yang harus tertutup penuh (default = bbox pencarian).
 */
export async function bestSentinel2(bbox, startMs, endMs, maxCloud = 40, coverBbox = bbox) {
  const items = await search({
    collections: ['sentinel-2-l2a'],
    bbox,
    datetime: `${iso(startMs)}/${iso(endMs)}`,
    query: { 'eo:cloud_cover': { lt: maxCloud } },
    sortby: [{ field: 'eo:cloud_cover', direction: 'asc' }],
    limit: 20,
  });
  const item = items.find((it) => geometryCoversBbox(it.geometry, coverBbox));
  return item
    ? { id: item.id, datetime: item.properties.datetime, cloud: Math.round(item.properties['eo:cloud_cover'] * 10) / 10 }
    : null;
}

// Kelas Scene Classification (SCL) Sentinel-2 L2A yang dianggap "tertutup": bayangan awan, awan
// probabilitas sedang/tinggi, cirrus tipis. 0 = tanpa data (di luar sapuan satelit).
const SCL_CLOUD = new Set([3, 8, 9, 10]);
const SCL_NODATA = 0;

const bboxFeature = ([w, s, e, n]) => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
});

/**
 * Persentase awan & tanpa-data TEPAT di area bbox, dari histogram band SCL (PC Data API).
 * eo:cloud_cover adalah rata-rata satu petak ±110 km — bisa 5% padahal lokasi kejadian tertutup awan.
 */
export async function localCloud(itemId, bbox) {
  const url = `${PC_STATS}?collection=sentinel-2-l2a&item=${itemId}&assets=SCL&categorical=true&max_size=256`;
  const res = await postJson(url, bboxFeature(bbox));
  const [counts, values] = res.properties.statistics.SCL_b1.histogram;
  let total = 0;
  let cloud = 0;
  let nodata = 0;
  values.forEach((v, i) => {
    total += counts[i];
    if (SCL_CLOUD.has(v)) cloud += counts[i];
    if (v === SCL_NODATA) nodata += counts[i];
  });
  const pct = (x) => (total ? Math.round((x / total) * 1000) / 10 : 100);
  return { cloud: pct(cloud), nodata: pct(nodata) };
}

/**
 * Scene Sentinel-2 dengan awan LOKAL paling sedikit di area tampilan (coverBbox).
 * Kandidat: scene yang menutupi area, diurutkan awan petak; `candidates` teratas diukur awan lokalnya.
 * Scene yang praktis bersih (≤ clearPct) → dipilih yang paling dekat tanggal acuan `anchorMs`,
 * agar perbandingan tetap mewakili kondisi sesaat sebelum/sesudah kejadian.
 */
export async function clearestSentinel2(bbox, startMs, endMs, { coverBbox = bbox, anchorMs, maxSceneCloud = 70, candidates = 10, clearPct = 1 } = {}) {
  const items = (
    await search({
      collections: ['sentinel-2-l2a'],
      bbox,
      datetime: `${iso(startMs)}/${iso(endMs)}`,
      query: { 'eo:cloud_cover': { lt: maxSceneCloud } },
      sortby: [{ field: 'eo:cloud_cover', direction: 'asc' }],
      limit: 100,
    })
  )
    .filter((it) => geometryCoversBbox(it.geometry, coverBbox))
    .slice(0, candidates);

  const measured = (
    await pool(items, 4, async (it) => {
      const local = await localCloud(it.id, coverBbox).catch(() => null);
      return local && local.nodata < 1 ? { it, local } : null;
    })
  ).filter(Boolean);
  if (!measured.length) return null;

  const dist = (x) => Math.abs(Date.parse(x.it.properties.datetime) - (anchorMs ?? 0));
  const clear = measured.filter((x) => x.local.cloud <= clearPct);
  const best = clear.length
    ? clear.sort((a, b) => dist(a) - dist(b))[0]
    : measured.sort((a, b) => a.local.cloud - b.local.cloud || dist(a) - dist(b))[0];
  return {
    id: best.it.id,
    datetime: best.it.properties.datetime,
    cloud: Math.round(best.it.properties['eo:cloud_cover'] * 10) / 10,
    local_cloud: best.local.cloud,
  };
}

/** Scene S2 terbaik untuk satu tahun: utamakan musim kemarau (Jun–Sep), lalu sepanjang tahun. */
export async function bestSentinel2OfYear(bbox, year) {
  return (
    (await bestSentinel2(bbox, Date.UTC(year, 5, 1), Date.UTC(year, 9, 1), 30)) ||
    bestSentinel2(bbox, Date.UTC(year, 0, 1), Date.UTC(year + 1, 0, 1), 40)
  );
}

/** Pasangan Sentinel-1 RTC sebelum/sesudah tanggal pada relative orbit yang sama, jeda terpendek. */
export async function sentinel1Pair(bbox, eventMs, windowDays) {
  const items = await search({
    collections: ['sentinel-1-rtc'],
    bbox,
    datetime: `${iso(eventMs - windowDays * DAY)}/${iso(eventMs + windowDays * DAY)}`,
    limit: 200,
  });
  const t = (it) => Date.parse(it.properties.datetime);
  const brief = (it) => ({ id: it.id, datetime: it.properties.datetime });
  let best = null;
  for (const orbit of new Set(items.map((it) => it.properties['sat:relative_orbit']))) {
    const list = items.filter((it) => it.properties['sat:relative_orbit'] === orbit);
    const pre = list.filter((it) => t(it) < eventMs).sort((a, b) => t(b) - t(a))[0];
    const post = list.filter((it) => t(it) >= eventMs).sort((a, b) => t(a) - t(b))[0];
    if (!pre || !post) continue;
    const gap = Math.round((t(post) - t(pre)) / DAY);
    if (!best || gap < best.gap_days) {
      best = { relative_orbit: orbit, orbit_state: pre.properties['sat:orbit_state'], gap_days: gap, pre: brief(pre), post: brief(post) };
    }
  }
  return best;
}
