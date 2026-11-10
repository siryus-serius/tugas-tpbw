/**
 * Gempa terkini BMKG (Data Terbuka BMKG, https://data.bmkg.go.id/gempabumi — wajib mencantumkan BMKG).
 * Feed: autogempa (1), gempaterkini (15, M≥5), gempadirasakan (15). Tanpa login, ber-CORS.
 */
const BASE = 'https://data.bmkg.go.id/DataMKG/TEWS';
const FEEDS = ['autogempa', 'gempaterkini', 'gempadirasakan'];

function toFeature(g, feed) {
  const [lat, lng] = g.Coordinates.split(',').map(Number);
  return {
    type: 'Feature',
    id: `bmkg-${g.DateTime}`,
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      id: `bmkg-${g.DateTime}`,
      mag: Number(g.Magnitude),
      depth_km: parseFloat(g.Kedalaman),
      time: g.DateTime,
      place: g.Wilayah,
      dirasakan: g.Dirasakan ?? null,
      potensi: g.Potensi ?? null,
      shakemap: g.Shakemap ? `https://static.bmkg.go.id/${g.Shakemap}` : null,
      feed,
      source: 'BMKG',
    },
  };
}

export async function fetchBmkgQuakes(signal) {
  const results = await Promise.allSettled(
    FEEDS.map((f) => fetch(`${BASE}/${f}.json`, { signal }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))))
  );
  const byId = new Map();
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    const g = r.value?.Infogempa?.gempa;
    for (const item of Array.isArray(g) ? g : g ? [g] : []) {
      const f = toFeature(item, FEEDS[i]);
      byId.set(f.id, { ...byId.get(f.id), ...f, properties: { ...byId.get(f.id)?.properties, ...f.properties } });
    }
  });
  if (!byId.size && results.every((r) => r.status === 'rejected')) throw new Error('Feed BMKG tidak dapat diakses');
  return [...byId.values()].sort((a, b) => b.properties.time.localeCompare(a.properties.time));
}
