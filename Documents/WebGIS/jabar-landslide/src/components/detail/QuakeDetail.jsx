import { dateId } from '../../utils/format';
import { TRIGGER, distanceKm } from '../../utils/seismic';

const WIB = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' };

export default function QuakeDetail({ feature, events }) {
  const p = feature.properties;
  const t = Date.parse(p.time);
  const after = events
    .map((e) => ({
      e,
      d: distanceKm(e.geometry.coordinates, feature.geometry.coordinates),
      dt: (Date.parse(`${e.properties.tanggal}T23:59:59+07:00`) - t) / 86400000,
    }))
    .filter(({ d, dt }) => d <= TRIGGER.radiusKm && dt >= 0 && dt <= TRIGGER.daysBefore);

  let linked;
  if (p.mag < TRIGGER.minMag) linked = `– (M < ${TRIGGER.minMag}, umumnya tidak memicu longsor)`;
  else if (after.length) linked = after.map(({ e, d }) => `#${e.properties.no} ${e.properties.kecamatan} (${d.toFixed(0)} km)`).join(', ');
  else linked = `Tidak ada kejadian tercatat ≤${TRIGGER.radiusKm} km dalam ${TRIGGER.daysBefore} hari`;

  return (
    <>
      <p className="eyebrow">Gempa bumi · {p.source}</p>
      <h2>M {p.mag}</h2>
      <dl>
        <dt>Waktu</dt>
        <dd>{dateId(p.time, WIB)} WIB</dd>
        <dt>Kedalaman</dt>
        <dd>{p.depth_km} km</dd>
        <dt>Lokasi</dt>
        <dd>{p.place}</dd>
        {p.dirasakan && (
          <>
            <dt>Dirasakan</dt>
            <dd>{p.dirasakan}</dd>
          </>
        )}
        {p.potensi && (
          <>
            <dt>Potensi</dt>
            <dd>{p.potensi}</dd>
          </>
        )}
        <dt>Longsor setelahnya</dt>
        <dd>{linked}</dd>
      </dl>
      {p.shakemap && <img className="shakemap" src={p.shakemap} alt="Peta guncangan BMKG" loading="lazy" />}
      <p className="muted small">
        Sumber: {p.source === 'BMKG' ? 'BMKG (Data Terbuka BMKG)' : 'katalog USGS'}
        {p.url && (
          <>
            {' · '}
            <a href={p.url} target="_blank" rel="noreferrer">
              detail
            </a>
          </>
        )}
      </p>
    </>
  );
}
