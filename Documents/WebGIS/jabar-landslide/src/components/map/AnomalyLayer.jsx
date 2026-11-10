import { useMemo } from 'react';
import L from 'leaflet';
import { Marker, Tooltip } from 'react-leaflet';
import { signed } from '../../utils/format';
import { formatFS } from '../../utils/factorOfSafety';
import { anomalyColor } from '../../utils/markerColors';

const icon = (color, active) =>
  L.divIcon({
    className: '',
    html: `<span class="anomaly-pin${active ? ' active' : ''}" style="--c:${color}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

export default function AnomalyLayer({ anomalies, colorMode, stability, selectedId, onSelect }) {
  // divIcon dibuat ulang hanya bila warna/seleksi berubah
  const icons = useMemo(
    () =>
      new Map(
        anomalies.map((f) => [f.id, icon(anomalyColor(f, { colorMode, stability }), f.id === selectedId)])
      ),
    [anomalies, colorMode, stability, selectedId]
  );

  return anomalies.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const p = f.properties;
    return (
      <Marker
        key={f.id}
        position={[lat, lng]}
        icon={icons.get(f.id)}
        eventHandlers={{ click: () => onSelect({ type: 'anomaly', feature: f }) }}
      >
        <Tooltip direction="top">
          Anomali {signed(p.delta_mm_yr)} mm/thn — {p.wilayah}
          {colorMode === 'stabilitas' && ` · FK ${formatFS(stability.get(f.id)?.fsMin)}`}
        </Tooltip>
      </Marker>
    );
  });
}
