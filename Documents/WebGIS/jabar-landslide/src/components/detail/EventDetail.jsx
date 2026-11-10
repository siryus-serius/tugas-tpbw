import { dateId } from '../../utils/format';
import PrePostImagery from './PrePostImagery';
import StabilityCard from './StabilityCard';

export default function EventDetail({ feature, scenes, stability, params }) {
  const p = feature.properties;
  const coord = feature.geometry.coordinates;

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

      <StabilityCard result={stability} params={params} slopeSource="P90 ±400 m, DEM Copernicus 90 m" />

      {scenes ? (
        <>
          <PrePostImagery
            title="Sentinel-2 · warna asli"
            kind="s2rgb"
            pre={scenes.s2.pre}
            post={scenes.s2.post}
            coord={coord}
            note={`Scene paling sedikit awan ±120 hari dari kejadian (awan ${scenes.s2.pre?.cloud ?? '–'}% / ${scenes.s2.post?.cloud ?? '–'}%).`}
          />
          <PrePostImagery
            title="Sentinel-2 · NDVI"
            kind="s2ndvi"
            pre={scenes.s2.pre}
            post={scenes.s2.post}
            coord={coord}
            note="Bekas longsoran tampak sebagai vegetasi yang hilang (hijau → kuning/merah)."
          />
          <PrePostImagery
            title="Sentinel-1 · radar VV"
            kind="s1vv"
            pre={scenes.s1?.pre}
            post={scenes.s1?.post}
            coord={coord}
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
