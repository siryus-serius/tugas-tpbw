import { CircleMarker, Tooltip } from 'react-leaflet';
import { QUAKE_COLOR } from '../../config/constants';
const radius = (m) => Math.max(4, (m - 2.5) * 4);

/** Gempa: BMKG terkini (merah) & riwayat USGS (biru); ukuran ∝ magnitudo. */
export default function QuakeLayer({ quakes, selectedId, onSelect }) {
  return quakes.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const p = f.properties;
    return (
      <CircleMarker
        key={f.id}
        center={[lat, lng]}
        radius={radius(p.mag) + (f.id === selectedId ? 3 : 0)}
        pathOptions={{ color: QUAKE_COLOR[p.source], weight: 1.5, fillColor: QUAKE_COLOR[p.source], fillOpacity: 0.25 }}
        eventHandlers={{ click: () => onSelect({ type: 'quake', feature: f }) }}
      >
        <Tooltip direction="top">
          Gempa M{p.mag} · {p.source} · {p.time.slice(0, 10)}
        </Tooltip>
      </CircleMarker>
    );
  });
}
