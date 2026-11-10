import { compassName, movementInfo } from '../../utils/direction';
import { signed } from '../../utils/format';
import PrePostImagery from './PrePostImagery';
import RiskCard from './RiskCard';
import StabilityCard from './StabilityCard';

export default function AnomalyDetail({ feature, stability, risk, params }) {
  const p = feature.properties;
  const coord = feature.geometry.coordinates;
  const movement = movementInfo({ type: 'anomaly', feature });

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
        {movement && (
          <>
            <dt>Arah geseran</dt>
            <dd>
              {compassName(movement.aspect)} ({movement.aspect}°){' '}
              <span className={movement.consistent === true ? 'ok' : 'muted'}>
                {movement.consistent === true
                  ? '✓ konsisten dengan lereng'
                  : movement.consistent === false
                    ? '✗ tidak konsisten'
                    : '? tak dapat dipastikan'}
              </span>
            </dd>
          </>
        )}
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

      <RiskCard risk={risk} />
      <StabilityCard result={stability} params={params} slopeSource="rata-rata klaster, DEM LiCSAR" />

      <PrePostImagery
        title={`Sentinel-2 · ${p.year - 1} vs ${p.year}`}
        preset="s2_true"
        pre={p.s2_pre}
        post={p.s2_post}
        coord={coord}
        delta={0.01}
        movement={movement}
      />
      <PrePostImagery
        title="Sentinel-2 · NDVI"
        preset="s2_ndvi"
        pre={p.s2_pre}
        post={p.s2_post}
        coord={coord}
        delta={0.01}
        movement={movement}
      />
      <p className="muted small">
        Anomali = kecepatan pergeseran tahun {p.year} menyimpang signifikan dari rata-rata tahun sebelumnya (InSAR stacking,
        resolusi ±220 m). Ini indikasi awal untuk dicek lapangan, bukan konfirmasi longsor.
      </p>
    </>
  );
}
