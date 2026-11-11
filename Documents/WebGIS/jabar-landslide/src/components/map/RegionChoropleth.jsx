import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import { classOf } from '../../utils/regionCounts';

/**
 * Pewarnaan kabupaten/kota (choropleth) saat peta diperkecil: warna = kelas jumlah kejadian
 * pada periode & sumber terpilih. Hanya isian (tanpa garis), garis batas tetap dari lapisan batas.
 */
export default function RegionChoropleth({ adm, region }) {
  const counts = useMemo(() => new Map(region.groups.filter((g) => !g.onlyVerified).map((g) => [g.key, g.count])), [region]);
  // Kunci berubah bila angka berubah → GeoJSON digambar ulang dengan gaya baru
  const key = useMemo(() => [...counts].map(([k, n]) => `${k}:${n}`).join('|'), [counts]);
  if (!adm) return null;
  const style = (f) => {
    const n = counts.get(f.properties.shapeName) ?? 0;
    return {
      stroke: false,
      fillColor: n ? classOf(n, region.classes).color : 'transparent',
      fillOpacity: n ? 0.32 : 0,
      interactive: false,
    };
  };
  return <GeoJSON key={key} data={adm} style={style} />;
}
