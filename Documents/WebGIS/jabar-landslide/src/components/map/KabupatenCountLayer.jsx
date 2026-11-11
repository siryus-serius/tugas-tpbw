import L from 'leaflet';
import { Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { AGGREGATE_MAX_ZOOM, countClass } from '../../config/constants';
import { dateId, shortKab } from '../../utils/format';

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

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'sumber';
  }
};

/** Satu baris kejadian di daftar kabupaten: tanggal, lokasi, korban, tautan berita. */
function EventItem({ f, onSelect }) {
  const p = f.properties;
  const onMap = Boolean(f.geometry?.coordinates);
  return (
    <li className="kab-event">
      <div className="kab-event-head">
        <strong>{dateId(p.tanggal, { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
        <span className="kab-event-loc">
          {p.kecamatan}
          {p.desa && p.desa !== '-' ? `, ${p.desa}` : ''}
        </span>
      </div>
      <p className="kab-event-desc">
        {p.korban_meninggal > 0 ? `${p.korban_meninggal} meninggal. ` : ''}
        {p.keterangan}
      </p>
      <div className="kab-event-links">
        {p.tautan_sumber?.map((u) => (
          <a key={u} href={u} target="_blank" rel="noreferrer">
            {hostOf(u)}
          </a>
        ))}
        {onMap ? (
          <button className="link" onClick={() => onSelect({ type: 'event', feature: f })}>
            Lihat titik
          </button>
        ) : (
          <span className="tag no-coord-tag">tanpa koordinat</span>
        )}
      </div>
    </li>
  );
}

/**
 * Saat peta diperkecil: kejadian digabung menjadi satu simbol angka per kabupaten/kota.
 * Klik simbol → daftar seluruh kejadian di wilayah itu (termasuk yang tanpa koordinat) beserta
 * tautan beritanya, dan tombol untuk memperbesar ke wilayah tersebut.
 */
export default function KabupatenCountLayer({ groups, periodLabel, onSelect }) {
  const map = useMap();

  const zoomTo = (bounds) => {
    const z = Math.min(11, Math.max(AGGREGATE_MAX_ZOOM + 1, map.getBoundsZoom(bounds, false, L.point(40, 40))));
    map.closePopup();
    map.flyTo(L.latLngBounds(bounds).getCenter(), z, { duration: 0.8 });
  };

  return groups.map((g) => (
    <Marker key={g.key} position={g.label} icon={iconFor(g.count)} keyboard title={`${shortKab(g.name)}: ${g.count} kejadian`}>
      <Tooltip direction="top" offset={[0, -12]}>
        <strong>{shortKab(g.name)}</strong>
        <br />
        {g.count} kejadian longsor · {g.deaths} korban meninggal
        <br />
        <span className="muted">Periode {periodLabel} · klik untuk melihat daftar</span>
      </Tooltip>
      <Popup className="info-popup kab-popup" maxWidth={340} minWidth={280} autoPanPadding={[24, 80]}>
        <p className="eyebrow">Kejadian longsor · {periodLabel}</p>
        <h3 className="kab-popup-title">{shortKab(g.name)}</h3>
        <p className="muted small">
          {g.count} kejadian · {g.deaths} korban meninggal
          {g.noCoord > 0 && ` · ${g.noCoord} tanpa koordinat`}
        </p>
        <ul className="kab-event-list">
          {g.events.map((f) => (
            <EventItem key={f.id} f={f} onSelect={onSelect} />
          ))}
        </ul>
        <button className="btn-zoom" onClick={() => zoomTo(g.bounds)}>
          Perbesar ke wilayah ini
        </button>
      </Popup>
    </Marker>
  ));
}
