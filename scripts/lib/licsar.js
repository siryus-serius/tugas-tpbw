/** Akses produk COMET-LiCSAR: daftar interferogram, rantai per tahun, dan pembacaan GeoTIFF. */
import { fromArrayBuffer } from 'geotiff';
import { LICSAR } from '../config.js';
import { fetchRetry } from './http.js';

const toUtc = (s) => Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));

export async function listPairs(frame) {
  const html = await fetchRetry(`${LICSAR.list}/${frame.track}/${frame.id}/interferograms/`, { as: 'text' });
  return [...new Set(html.match(/\d{8}_\d{8}/g) || [])].map((id) => {
    const [a, b] = id.split('_');
    return { id, t1: toUtc(a), t2: toUtc(b), days: (toUtc(b) - toUtc(a)) / 86400000 };
  });
}

/** Rantai interferogram berurutan (jeda 6–24 hari) tanpa tumpang tindih waktu dalam satu tahun. */
export function chainForYear(pairs, year) {
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  const cand = pairs.filter((p) => p.t1 >= start && p.t2 <= end && p.days >= 6 && p.days <= 24);
  const byStart = new Map();
  for (const p of cand) if (!byStart.has(p.t1) || byStart.get(p.t1).days > p.days) byStart.set(p.t1, p);
  const chain = [];
  let cur = -Infinity;
  for (const s of [...byStart.keys()].sort((a, b) => a - b)) {
    if (s < cur) continue;
    const p = byStart.get(s);
    chain.push(p);
    cur = p.t2;
  }
  return { chain, available: cand.length };
}

async function decodeTif(buf) {
  const img = await (await fromArrayBuffer(buf)).getImage();
  const [ox, oy] = img.getOrigin();
  const [rx, ry] = img.getResolution();
  const [data] = await img.readRasters();
  return { data, w: img.getWidth(), h: img.getHeight(), ox, oy, rx, ry };
}

/** GeoTIFF interferogram (suffix: 'geo.unw.tif' | 'geo.cc.tif'); coba JASMIN lalu arsip CEDA. */
export async function readPairTif(frame, pairId, suffix) {
  const urls = [
    `${LICSAR.files}/${frame.track}/${frame.id}/interferograms/${pairId}/${pairId}.${suffix}`,
    `${LICSAR.archive}/${frame.track}/${frame.id}/${pairId}/${pairId}.${suffix}`,
  ];
  for (const url of urls) {
    try {
      return await decodeTif(await fetchRetry(url, { as: 'arrayBuffer' }));
    } catch (err) {
      if (url === urls.at(-1)) throw err;
    }
  }
}

/** Geometri akuisisi frame dari metadata.txt: heading (°) & sudut datang rata-rata (°). */
export async function readFrameGeometry(frame) {
  const txt = await fetchRetry(`${LICSAR.list}/${frame.track}/${frame.id}/metadata/metadata.txt`, { as: 'text' });
  const get = (k) => Number(txt.match(new RegExp(`^${k}=([-0-9.]+)`, 'm'))?.[1]);
  return { heading: get('heading'), incidence: get('avg_incidence_angle') };
}

/** DEM frame (metadata/<frame>.geo.hgt.tif). */
export async function readFrameDem(frame) {
  const url = `${LICSAR.list}/${frame.track}/${frame.id}/metadata/${frame.id}.geo.hgt.tif`;
  return decodeTif(await fetchRetry(url, { as: 'arrayBuffer' }));
}
