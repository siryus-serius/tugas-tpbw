/**
 * Mendaftarkan pencarian mosaik Sentinel di Planetary Computer untuk satu periode (tahun / bulan)
 * di atas Jawa Barat. Hasil (search id) di-cache per koleksi+periode selama sesi.
 */
import { PC_DATA_URL } from '../utils/sentinelImagery';

const JABAR = [
  [
    [106.3, -7.9],
    [108.9, -7.9],
    [108.9, -5.9],
    [106.3, -5.9],
    [106.3, -7.9],
  ],
];
const cache = new Map();

export function periodRange(year, month) {
  const start = month ? new Date(Date.UTC(year, month - 1, 1)) : new Date(Date.UTC(year, 0, 1));
  const end = month ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year + 1, 0, 1));
  return [start.toISOString(), new Date(end - 1000).toISOString()];
}

export async function registerMosaic({ collection, year, month, signal }) {
  const key = `${collection}|${year}|${month}`;
  if (cache.has(key)) return cache.get(key);

  const [start, end] = periodRange(year, month);
  const args = [
    { op: 'anyinteracts', args: [{ property: 'datetime' }, { interval: [start, end] }] },
    { op: 's_intersects', args: [{ property: 'geometry' }, { type: 'Polygon', coordinates: JABAR }] },
  ];
  if (collection === 'sentinel-2-l2a') args.push({ op: '<=', args: [{ property: 'eo:cloud_cover' }, month ? 60 : 25] });

  const res = await fetch(`${PC_DATA_URL}/mosaic/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      collections: [collection],
      'filter-lang': 'cql2-json',
      filter: { op: 'and', args },
      // S2: piksel dari scene paling sedikit awan; S1: akuisisi terbaru
      sortby:
        collection === 'sentinel-2-l2a'
          ? [{ field: 'eo:cloud_cover', direction: 'asc' }]
          : [{ field: 'datetime', direction: 'desc' }],
    }),
  });
  if (!res.ok) throw new Error(`Planetary Computer HTTP ${res.status}`);
  const { searchid, id } = await res.json();
  cache.set(key, searchid ?? id);
  return searchid ?? id;
}
