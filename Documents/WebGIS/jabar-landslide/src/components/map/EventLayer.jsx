import { CircleMarker, Tooltip } from 'react-leaflet';
import { shortKab } from '../../utils/format';
import { eventColor } from '../../utils/markerColors';
import { inYear } from '../../utils/years';

export default function EventLayer({ events, ctx, selectedId, onSelect }) {
  return events.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const p = f.properties;
    const current = inYear(p.tahun, ctx.year);
    return (
      <CircleMarker
        key={f.id}
        center={[lat, lng]}
        radius={f.id === selectedId ? 10 : current ? 8 : 5}
        pathOptions={{
          color: '#fff',
          weight: 2,
          fillColor: eventColor(f, ctx),
          fillOpacity: current || ctx.colorMode !== 'kategori' ? 0.95 : 0.7,
          dashArray: p.jenis_koordinat?.includes('perkiraan') ? '3 3' : null,
        }}
        eventHandlers={{ click: () => onSelect({ type: 'event', feature: f }) }}
      >
        <Tooltip direction="top">
          Longsor · {p.kecamatan}, {shortKab(p.kabupaten)} — {p.tanggal}
        </Tooltip>
      </CircleMarker>
    );
  });
}
