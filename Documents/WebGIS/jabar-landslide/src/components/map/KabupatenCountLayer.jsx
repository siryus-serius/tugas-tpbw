import L from 'leaflet';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import { AGGREGATE_MAX_ZOOM, countClass } from '../../config/constants';
import { shortKab } from '../../utils/format';

const iconFor = (count) => {
  const c = countClass(count);
  const size = Math.round(24 + 8 * Math.sqrt(count));
  return L.divIcon({
    className: 'kab-count-icon',
    html: `<span class="kab-count" style="--c:${c.color};--ink:${c.ink};--s:${size}px">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

/**
 * Saat peta diperkecil: kejadian digabung menjadi satu simbol angka per kabupaten/kota.
 * Klik simbol → peta diperbesar ke wilayah itu dan titik kejadian kembali tampil.
 */
export default function KabupatenCountLayer({ groups, periodLabel }) {
  const map = useMap();

  const zoomTo = (bounds) => {
    const z = Math.min(11, Math.max(AGGREGATE_MAX_ZOOM + 1, map.getBoundsZoom(bounds, false, L.point(40, 40))));
    map.flyTo(L.latLngBounds(bounds).getCenter(), z, { duration: 0.8 });
  };

  return groups.map((g) => (
    <Marker
      key={g.key}
      position={g.label}
      icon={iconFor(g.count)}
      keyboard
      title={`${shortKab(g.name)}: ${g.count} kejadian`}
      eventHandlers={{ click: () => zoomTo(g.bounds) }}
    >
      <Tooltip direction="top" offset={[0, -12]}>
        <strong>{shortKab(g.name)}</strong>
        <br />
        {g.count} kejadian longsor · {g.deaths} korban meninggal
        <br />
        <span className="muted">Periode {periodLabel} · klik untuk memperbesar</span>
      </Tooltip>
    </Marker>
  ));
}
