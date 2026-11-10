/**
 * Esri World Imagery Wayback: arsip citra resolusi tinggi (±0,3–0,6 m, umumnya Maxar) per tanggal rilis.
 * Publik, tanpa login. Tanggal = tanggal RILIS mosaik, bukan tanggal akuisisi citra di lokasi tertentu.
 */
const CONFIG = 'https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json';
let releases = null;

export async function waybackReleases() {
  if (releases) return releases;
  const res = await fetch(CONFIG);
  if (!res.ok) throw new Error(`Wayback HTTP ${res.status}`);
  const json = await res.json();
  releases = Object.entries(json)
    .map(([id, r]) => ({
      id,
      date: r.itemTitle.match(/\d{4}-\d{2}-\d{2}/)?.[0],
      url: r.itemURL.replace('{level}', '{z}').replace('{row}', '{y}').replace('{col}', '{x}'),
    }))
    .filter((r) => r.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  return releases;
}

/** Rilis terakhir sebelum `beforeDate` dan rilis terbaru sesudah/sama dengan `afterDate` (YYYY-MM-DD). */
export async function waybackPair(beforeDate, afterDate) {
  const list = await waybackReleases();
  const pre = [...list].reverse().find((r) => r.date < beforeDate) ?? list[0];
  const post = list.at(-1).date >= afterDate ? list.at(-1) : null;
  return { pre, post };
}
