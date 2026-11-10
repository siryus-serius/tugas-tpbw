import { CircleMarker, Tooltip } from 'react-leaflet';
import { shortKab } from '../../utils/format';
import { formatFS } from '../../utils/factorOfSafety';
import { eventColor } from '../../utils/markerColors';

export default function EventLayer({ events, year, colorMode, stability, selectedId, onSelect }) {
  return events.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const p = f.properties;
    const current = p.tahun === year;
    const fs = stability.get(f.id);
    return (
      <CircleMarker
        key={f.id}
        center={[lat, lng]}
        radius={f.id === selectedId ? 10 : current ? 8 : 5}
        pathOptions={{
          color: '#fff',
          weight: 2,
          fillColor: eventColor(f, { year, colorMode, stability }),
          fillOpacity: current || colorMode === 'stabilitas' ? 0.95 : 0.7,
          dashArray: p.jenis_koordinat?.includes('perkiraan') ? '3 3' : null,
        }}
        eventHandlers={{ click: () => onSelect({ type: 'event', feature: f }) }}
      >
        <Tooltip direction="top">
          {p.kecamatan}, {shortKab(p.kabupaten)} — {p.tanggal}
          {colorMode === 'stabilitas' && ` · FK ${formatFS(fs?.fsMin)}`}
        </Tooltip>
      </CircleMarker>
    );
  });
}
