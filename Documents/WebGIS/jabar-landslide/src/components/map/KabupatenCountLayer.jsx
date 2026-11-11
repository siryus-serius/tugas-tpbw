import L from 'leaflet';
import { Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { AGGREGATE_MAX_ZOOM } from '../../config/constants';
import { dateId, shortKab } from '../../utils/format';
import { classOf } from '../../utils/regionCounts';

const fmt = (n) => n.toLocaleString('id-ID');

/** Simbol angka; ukuran skala log agar 1 dan 2.000 tetap proporsional di layar. */
const iconFor = (n, classes, onlyVerified) => {
  const c = onlyVerified ? { color: 'var(--panel)', ink: 'var(--text)' } : classOf(n, classes);
  const size = Math.round(26 + 10 * Math.log10(n + 1));
  return L.divIcon({
    className: 'kab-count-icon',
    html: `<span class="kab-count${onlyVerified ? ' is-verified-only' : ''}" style="--c:${c.color};--ink:${c.ink};--s:${size}px">${fmt(n)}</span>`,
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
export default function KabupatenCountLayer({ region, periodLabel, onSelect }) {
  const { groups, classes, source, galuraLabel, galuraUrl } = region;
  const isGalura = source === 'galura';
  const map = useMap();

  const zoomTo = (bounds) => {
    const z = Math.min(11, Math.max(AGGREGATE_MAX_ZOOM + 1, map.getBoundsZoom(bounds, false, L.point(40, 40))));
    map.closePopup();
    map.flyTo(L.latLngBounds(bounds).getCenter(), z, { duration: 0.8 });
  };

  return groups.map((g) => {
    const n = g.onlyVerified ? g.events.length : g.count;
    const per = isGalura && !g.onlyVerified ? galuraLabel : periodLabel;
    return (
    <Marker key={g.key} position={g.label} icon={iconFor(n, classes, g.onlyVerified)} keyboard title={`${shortKab(g.name)}: ${fmt(n)} kejadian`}>
      <Tooltip direction="top" offset={[0, -12]}>
        <strong>{shortKab(g.name)}</strong>
        <br />
        {g.onlyVerified
          ? `${n} kejadian terverifikasi (tidak tercakup data Galura)`
          : isGalura
            ? `${fmt(n)} kejadian longsor tercatat desa (Galura/DPMD)`
            : `${n} kejadian longsor · ${g.deaths} korban meninggal`}
        <br />
        <span className="muted">Periode {per} · klik untuk detail</span>
      </Tooltip>
      <Popup className="info-popup kab-popup" maxWidth={340} minWidth={280} autoPanPadding={[24, 80]}>
        <p className="eyebrow">Kejadian longsor · {periodLabel}</p>
        <h3 className="kab-popup-title">{shortKab(g.name)}</h3>
        {g.galura && (
          <div className="kab-galura">
            <p>
              <strong>{fmt(g.galura.count)}</strong> kejadian tercatat desa di {g.galura.kecamatanCount} kecamatan
              <span className="muted small"> · {galuraLabel}</span>
            </p>
            {g.galura.top.length > 0 && (
              <ol className="kab-galura-top">
                {g.galura.top.map((c) => (
                  <li key={c.nama}>
                    <span>Kec. {c.nama}</span>
                    <strong>{fmt(c.count)}</strong>
                  </li>
                ))}
              </ol>
            )}
            <p className="muted small">
              Sumber:{' '}
              <a href={galuraUrl} target="_blank" rel="noreferrer">
                Galura Data Jabar (DPMD)
              </a>
            </p>
          </div>
        )}
        <h4 className="kab-popup-sub">Kejadian terverifikasi berita · {periodLabel}</h4>
        <p className="muted small">
          {g.events.length ? `${g.events.length} kejadian · ${g.deaths} korban meninggal` : 'Belum ada kejadian terverifikasi pada periode ini.'}
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
    );
  });
}
