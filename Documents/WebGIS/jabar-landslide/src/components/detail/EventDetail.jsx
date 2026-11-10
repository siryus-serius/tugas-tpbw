import { compassName, movementInfo } from '../../utils/direction';
import { dateId } from '../../utils/format';
import { TRIGGER, possibleTriggers } from '../../utils/seismic';
import PrePostImagery from './PrePostImagery';
import RiskCard from './RiskCard';
import StabilityCard from './StabilityCard';

export default function EventDetail({ feature, scenes, stability, risk, params, quakes }) {
  const p = feature.properties;
  const coord = feature.geometry.coordinates;
  const movement = movementInfo({ type: 'event', feature, scenes });
  const triggers = possibleTriggers(feature, quakes);
  const triggerText = triggers.length
    ? triggers
        .slice(0, 2)
        .map(({ q, d, dt }) => 'M' + q.properties.mag + ', ' + d.toFixed(0) + ' km, ' + Math.round(dt) + ' hari sebelumnya (' + q.properties.source + ')')
        .join('; ')
    : 'Tidak ada gempa M≥' + TRIGGER.minMag + ' ≤' + TRIGGER.radiusKm + ' km dalam ' + TRIGGER.daysBefore + ' hari sebelumnya';

  return (
    <>
      <p className="eyebrow">Kejadian longsor #{p.no}</p>
      <h2>
        {p.kecamatan}, {p.kabupaten}
      </h2>
      <dl>
        <dt>Tanggal</dt>
        <dd>{dateId(p.tanggal)}</dd>
        <dt>Korban meninggal</dt>
        <dd>{p.korban_meninggal}</dd>
        <dt>Lokasi</dt>
        <dd>
          {p.desa} · <span className="muted">{p.jenis_koordinat}</span>
        </dd>
        <dt>Keterangan</dt>
        <dd>{p.keterangan}</dd>
        {movement && (
          <>
            <dt>Arah lereng turun</dt>
            <dd>
              {compassName(movement.aspect)} ({movement.aspect}°) · kemiringan {movement.slope}°
            </dd>
          </>
        )}
        <dt>Gempa pemicu?</dt>
        <dd>{triggerText}</dd>
        <dt>Sumber</dt>
        <dd>
          {p.sumber}
          {p.tautan_sumber?.map((u, i) => (
            <a key={u} href={u} target="_blank" rel="noreferrer">
              {' '}
              [{i + 1}]
            </a>
          ))}
        </dd>
      </dl>

      <RiskCard risk={risk} />
      <StabilityCard result={stability} params={params} slopeSource="P90 ±400 m, DEM Copernicus 90 m" />

      {scenes ? (
        <>
          <PrePostImagery
            title="Sentinel-2 · warna asli"
            preset="s2_true"
            pre={scenes.s2.pre}
            post={scenes.s2.post}
            coord={coord}
            movement={movement}
            note={`Scene paling sedikit awan ±120 hari dari kejadian (awan ${scenes.s2.pre?.cloud ?? '–'}% / ${scenes.s2.post?.cloud ?? '–'}%).`}
          />
          <PrePostImagery
            title="Sentinel-2 · NDVI"
            preset="s2_ndvi"
            pre={scenes.s2.pre}
            post={scenes.s2.post}
            coord={coord}
            movement={movement}
            note="Bekas longsoran tampak sebagai vegetasi yang hilang (hijau → kuning/merah)."
          />
          <PrePostImagery
            title="Sentinel-1 · radar VV"
            preset="s1_vv"
            pre={scenes.s1?.pre}
            post={scenes.s1?.post}
            coord={coord}
            movement={movement}
            note={
              scenes.s1 &&
              `Orbit ${scenes.s1.relative_orbit} (${scenes.s1.orbit_state}), jeda ${scenes.s1.gap_days} hari. Radar menembus awan; perubahan tekstur/kecerahan menandai perubahan permukaan.`
            }
          />
        </>
      ) : (
        <p className="muted small">Belum ada data citra untuk kejadian ini.</p>
      )}
    </>
  );
}
