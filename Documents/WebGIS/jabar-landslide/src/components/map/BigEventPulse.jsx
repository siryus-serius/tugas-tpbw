import L from 'leaflet';
import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';

/**
 * Penanda berdenyut untuk kejadian longsor besar (≥ BIG_DEATHS korban) pada tahun terpilih.
 * Tampil di semua tingkat zoom agar kejadian besar langsung terlihat saat linimasa diputar.
 */
export default function BigEventPulse({ events, onSelect }) {
  const icon = useMemo(
    () => L.divIcon({ className: 'big-pulse-icon', html: '<span class="big-pulse"><i></i><i></i></span>', iconSize: [64, 64], iconAnchor: [32, 32] }),
    []
  );
  return events
    .filter((f) => f.geometry?.coordinates)
    .map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const p = f.properties;
      return (
        <Marker
          key={f.id}
          position={[lat, lng]}
          icon={icon}
          zIndexOffset={1000}
          eventHandlers={{ click: () => onSelect({ type: 'event', feature: f }) }}
        >
          <Tooltip direction="right" offset={[18, 0]} permanent className="big-pulse-label">
            {p.kecamatan} · {p.korban_meninggal} meninggal
          </Tooltip>
        </Marker>
      );
    });
}
