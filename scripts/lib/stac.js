/**
 * Pencarian scene Sentinel-1 RTC & Sentinel-2 L2A di Microsoft Planetary Computer (tanpa login).
 * Hanya ID scene yang disimpan; gambar di-render on-the-fly oleh PC Data API di frontend.
 */
import { geometryCoversBbox } from './geo.js';
import { postJson } from './http.js';

const STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
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
