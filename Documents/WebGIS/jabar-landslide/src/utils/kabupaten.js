// Agregasi titik kejadian per kabupaten/kota berdasarkan batas administrasi (jabar-adm.json).

/** "Kabupaten Bogor" → "Bogor", "Kota Bogor" tetap — sama dengan shapeName di jabar-adm.json. */
export const kabKey = (name) => name.replace(/^Kabupaten\s+/i, '').trim();

const polygonsOf = (geom) => (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates);

const ringArea = (ring) => {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  return Math.abs(a / 2);
};

function inPolygon(x, y, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

function segDist2(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  const qx = ax + t * dx - px;
  const qy = ay + t * dy - py;
  return qx * qx + qy * qy;
}

/**
 * Titik label di dalam poligon (paling jauh dari tepi, pencarian grid) — centroid biasa bisa jatuh
 * di luar wilayah (mis. Kab. Bandung yang mengelilingi Kota Bandung).
 */
function labelPoint(geom) {
  const rings = polygonsOf(geom).sort((a, b) => ringArea(b[0]) - ringArea(a[0]))[0];
  const xs = rings[0].map((c) => c[0]);
  const ys = rings[0].map((c) => c[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const N = 20;
  let best = null;
  let bestD = -1;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const x = minX + ((maxX - minX) * i) / N;
      const y = minY + ((maxY - minY) * j) / N;
      if (!inPolygon(x, y, rings)) continue;
      let d = Infinity;
      for (const ring of rings) for (let k = 1; k < ring.length; k++) d = Math.min(d, segDist2(x, y, ring[k - 1], ring[k]));
      if (d > bestD) [best, bestD] = [[y, x], d];
    }
  }
  return best ?? [(minY + maxY) / 2, (minX + maxX) / 2];
}

/** Map shapeName → { label: [lat, lng], bounds: [[s, w], [n, e]] }. */
export function buildKabupatenIndex(adm) {
  const index = new Map();
  for (const f of adm?.features ?? []) {
    const all = polygonsOf(f.geometry).flat(2);
    const xs = all.map((c) => c[0]);
    const ys = all.map((c) => c[1]);
    index.set(f.properties.shapeName, {
      label: labelPoint(f.geometry),
      bounds: [
        [Math.min(...ys), Math.min(...xs)],
        [Math.max(...ys), Math.max(...xs)],
      ],
    });
  }
  return index;
}

/**
 * Hitung kejadian per kabupaten/kota. Mengembalikan daftar terurut (terbanyak dulu):
 * { key, name, count, deaths, label, bounds, events, noCoord }. Kejadian tanpa koordinat ikut dihitung.
 */
export function countByKabupaten(events, index) {
  const groups = new Map();
  for (const f of events) {
    const name = f.properties.kabupaten;
    const g = groups.get(name) ?? { name, key: kabKey(name), list: [] };
    g.list.push(f);
    groups.set(name, g);
  }
  return [...groups.values()]
    .map(({ name, key, list }) => {
      const adm = index.get(key);
      const located = list.filter((f) => f.geometry?.coordinates);
      const mean = (k) => located.reduce((s, f) => s + f.geometry.coordinates[k], 0) / located.length;
      const label = adm?.label ?? (located.length ? [mean(1), mean(0)] : null);
      return {
        key,
        name,
        count: list.length,
        deaths: list.reduce((s, f) => s + (f.properties.korban_meninggal ?? 0), 0),
        label,
        bounds: adm?.bounds ?? [label, label],
        events: [...list].sort((a, b) => b.properties.tanggal.localeCompare(a.properties.tanggal)),
        noCoord: list.length - located.length,
      };
    })
    .filter((g) => g.label)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
