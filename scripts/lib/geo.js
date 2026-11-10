/** Utilitas geometri ringan (tanpa dependensi). */

export const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

export function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Nama kab/kota yang memuat titik, atau null bila di luar Jawa Barat. */
export function findRegion(adm, lng, lat) {
  for (const f of adm.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      if (pointInRing(lng, lat, poly[0]) && !poly.slice(1).some((hole) => pointInRing(lng, lat, hole))) {
        return f.properties.shapeName;
      }
    }
  }
  return null;
}

/** Jarak (km) aproksimasi equirectangular; cukup akurat untuk < 50 km. */
export function distKm([lng1, lat1], [lng2, lat2]) {
  const r = Math.PI / 180;
  const dx = (lng1 - lng2) * r * Math.cos(((lat1 + lat2) / 2) * r);
  return 6371 * Math.hypot(dx, (lat1 - lat2) * r);
}

/** True bila keempat sudut bbox berada di dalam geometri (Polygon/MultiPolygon) GeoJSON. */
export function geometryCoversBbox(geom, [minX, minY, maxX, maxY]) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  const corners = [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]];
  return corners.every(([x, y]) => polys.some((poly) => pointInRing(x, y, poly[0])));
}
