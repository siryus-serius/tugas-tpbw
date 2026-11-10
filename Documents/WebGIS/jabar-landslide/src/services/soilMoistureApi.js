/**
 * Kelembapan tanah zona akar (27–81 cm, m³/m³) dari Open-Meteo (model NWP global, tanpa login).
 * Satu request memuat banyak koordinat; titik yang berdekatan (< ~1 km) digabung karena
 * resolusi model ±10–25 km.
 */

const API = 'https://api.open-meteo.com/v1/forecast';
export const SOIL_LAYER = 'soil_moisture_27_to_81cm';
const CHUNK = 50;

const cellKey = ([lng, lat]) => `${lat.toFixed(2)},${lng.toFixed(2)}`;

/**
 * @param {{id: string, coord: [number, number]}[]} points
 * @returns {Promise<Map<string, {now: number|null, max72h: number|null}>>}
 */
export async function fetchSoilMoisture(points, signal) {
  const cells = [...new Set(points.map((p) => cellKey(p.coord)))];
  const byCell = new Map();

  for (let i = 0; i < cells.length; i += CHUNK) {
    const chunk = cells.slice(i, i + CHUNK);
    const lat = chunk.map((c) => c.split(',')[0]).join(',');
    const lng = chunk.map((c) => c.split(',')[1]).join(',');
    const url = `${API}?latitude=${lat}&longitude=${lng}&hourly=${SOIL_LAYER}&past_days=1&forecast_days=3&timeformat=unixtime`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const json = await res.json();
    const list = Array.isArray(json) ? json : [json];
    list.forEach((r, k) => byCell.set(chunk[k], summarize(r.hourly)));
  }

  return new Map(points.map((p) => [p.id, byCell.get(cellKey(p.coord)) ?? { now: null, max72h: null }]));
}

/** Nilai jam ini dan maksimum 72 jam ke depan (skenario terburuk untuk peringatan dini). */
function summarize(hourly) {
  const nowSec = Date.now() / 1000;
  const t = hourly.time;
  const v = hourly[SOIL_LAYER];
  let iNow = t.findIndex((x) => x > nowSec) - 1;
  if (iNow < 0) iNow = t.length - 1;
  const ahead = v.slice(iNow, iNow + 73).filter((x) => x != null);
  return { now: v[iNow] ?? null, max72h: ahead.length ? Math.max(...ahead) : null };
}
