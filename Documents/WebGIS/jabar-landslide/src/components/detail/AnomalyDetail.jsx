import { signed } from '../../utils/format';
import PrePostImagery from './PrePostImagery';
import StabilityCard from './StabilityCard';

export default function AnomalyDetail({ feature, stability, params }) {
  const p = feature.properties;
  const coord = feature.geometry.coordinates;

  return (
    <>
      <p className="eyebrow">Anomali pergeseran tanah {p.year} · deteksi otomatis</p>
      <h2>{p.wilayah}</h2>
      <p className={`badge sev-${p.severity.replace(' ', '-')}`}>Tingkat {p.severity}</p>
      <dl>
        <dt>Perubahan kecepatan</dt>
        <dd>
          <strong>{signed(p.delta_mm_yr)} mm/tahun</strong> (puncak {p.peak_delta_mm_yr})
        </dd>
        <dt>Kecepatan {p.year}</dt>
        <dd>{p.velocity_mm_yr} mm/tahun</dd>
        <dt>Rata-rata {p.baseline_years}</dt>
        <dd>{p.baseline_mm_yr} mm/tahun</dd>
        <dt>Arah (garis pandang satelit)</dt>
        <dd>{p.arah}</dd>
        <dt>Luas · lereng</dt>
        <dd>
          ±{p.area_ha} ha · {p.slope_deg ?? '–'}°
        </dd>
        <dt>Signifikansi</dt>
        <dd>z = {p.z_score}</dd>
        <dt>Data</dt>
        <dd>
          Sentinel-1 {p.orbit}, frame {p.frame}, {p.periode}
        </dd>
        {p.dekat_kejadian && (
          <>
            <dt>Dekat kejadian</dt>
            <dd>{p.dekat_kejadian}</dd>
          </>
        )}
      </dl>

      <StabilityCard result={stability} params={params} slopeSource="rata-rata klaster, DEM LiCSAR" />

      <PrePostImagery
        title={`Sentinel-2 · ${p.year - 1} vs ${p.year}`}
        kind="s2rgb"
        pre={p.s2_pre}
        post={p.s2_post}
        coord={coord}
        delta={0.01}
      />
      <PrePostImagery title="Sentinel-2 · NDVI" kind="s2ndvi" pre={p.s2_pre} post={p.s2_post} coord={coord} delta={0.01} />
      <p className="muted small">
        Anomali = kecepatan pergeseran tahun {p.year} menyimpang signifikan dari rata-rata tahun sebelumnya (InSAR stacking,
        resolusi ±220 m). Ini indikasi awal untuk dicek lapangan, bukan konfirmasi longsor.
      </p>
    </>
  );
}
