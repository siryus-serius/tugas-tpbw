import { useMemo } from 'react';
import L from 'leaflet';
import { Marker, Tooltip } from 'react-leaflet';
import { signed } from '../../utils/format';
import { anomalyColor } from '../../utils/markerColors';

const icon = (color, active) =>
  L.divIcon({
    className: '',
    html: `<span class="anomaly-pin${active ? ' active' : ''}" style="--c:${color}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

export default function AnomalyLayer({ anomalies, ctx, selectedId, onSelect }) {
  // divIcon dibuat ulang hanya bila warna/seleksi berubah
  const icons = useMemo(
    () => new Map(anomalies.map((f) => [f.id, icon(anomalyColor(f, ctx), f.id === selectedId)])),
    [anomalies, ctx, selectedId]
  );

  return anomalies.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    return (
      <Marker
        key={f.id}
        position={[lat, lng]}
        icon={icons.get(f.id)}
        eventHandlers={{ click: () => onSelect({ type: 'anomaly', feature: f }) }}
      >
        <Tooltip direction="top">
          Anomali pergeseran {signed(f.properties.delta_mm_yr)} mm/thn — {f.properties.wilayah}
        </Tooltip>
      </Marker>
    );
  });
}
