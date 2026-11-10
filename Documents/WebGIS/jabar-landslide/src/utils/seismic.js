/**
 * Kaitan gempa ↔ longsor (heuristik, transparan):
 * gempa M ≥ 4 (batas bawah pemicu longsor menurut Keefer, 1984) dalam radius 50 km dan
 * 0–14 hari sebelum kejadian dicatat sebagai "kemungkinan pemicu". Bukan bukti kausal.
 */
export const TRIGGER = { minMag: 4, radiusKm: 50, daysBefore: 14 };
const DAY = 86400000;

export function distanceKm([lng1, lat1], [lng2, lat2]) {
  const r = Math.PI / 180;
  const dx = (lng1 - lng2) * r * Math.cos(((lat1 + lat2) / 2) * r);
  return 6371 * Math.hypot(dx, (lat1 - lat2) * r);
}

/** Gempa yang mungkin memicu kejadian longsor (terurut: magnitudo terbesar dulu). */
export function possibleTriggers(eventFeature, quakes) {
  const t = Date.parse(`${eventFeature.properties.tanggal}T23:59:59+07:00`);
  return quakes
    .map((q) => ({ q, d: distanceKm(eventFeature.geometry.coordinates, q.geometry.coordinates), dt: (t - Date.parse(q.properties.time)) / DAY }))
    .filter(({ q, d, dt }) => q.properties.mag >= TRIGGER.minMag && d <= TRIGGER.radiusKm && dt >= 0 && dt <= TRIGGER.daysBefore)
    .sort((a, b) => b.q.properties.mag - a.q.properties.mag);
}

/**
 * Skor guncangan terkini (0–1) di satu titik: gempa 30 hari terakhir, makin besar & dekat makin tinggi.
 * Skala kasar: M 3,5 → 0, M 6 → 1; meluruh linier hingga 0 pada 50 km.
 */
export function recentShakingScore(coord, quakes, now = Date.now()) {
  let best = 0;
  for (const q of quakes) {
    if (now - Date.parse(q.properties.time) > 30 * DAY) continue;
    const d = distanceKm(coord, q.geometry.coordinates);
    if (d > TRIGGER.radiusKm) continue;
    const magScore = Math.min(1, Math.max(0, (q.properties.mag - 3.5) / 2.5));
    best = Math.max(best, magScore * (1 - d / TRIGGER.radiusKm));
  }
  return best;
}
