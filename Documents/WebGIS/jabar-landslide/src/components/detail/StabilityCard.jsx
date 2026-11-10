import { formatFS } from '../../utils/factorOfSafety';
import { percent } from '../../utils/format';

/** Kartu Faktor Keamanan satu titik: input (lereng, kelembapan) → FK sekarang & minimum 72 jam. */
export default function StabilityCard({ result, params, slopeSource }) {
  if (!result) return null;
  const { slopeDeg, theta, thetaMax, m, mMax, fsNow, fsMin, cls } = result;
  const missing = slopeDeg == null ? 'kemiringan lereng' : theta == null ? 'kelembapan tanah' : null;

  return (
    <div className="stability" style={{ '--c': cls?.color ?? 'var(--line)' }}>
      <h3>Stabilitas lereng saat ini</h3>
      {missing ? (
        <p className="muted small">FK belum dapat dihitung: data {missing} belum tersedia.</p>
      ) : (
        <>
          <div className="fs-value">
            <span>
              FK min. 72 jam <strong>{formatFS(fsMin)}</strong>
            </span>
            <span className="badge" style={{ background: cls.color }}>
              {cls.label}
            </span>
          </div>
          <dl>
            <dt>FK sekarang</dt>
            <dd>{formatFS(fsNow)}</dd>
            <dt>Kemiringan β</dt>
            <dd>
              {slopeDeg}° <span className="muted small">({slopeSource})</span>
            </dd>
            <dt>Kelembapan θ</dt>
            <dd>
              {theta?.toFixed(3)} → maks {thetaMax?.toFixed(3)} m³/m³
            </dd>
            <dt>Kejenuhan m</dt>
            <dd>
              {percent(m)} → maks {percent(mMax)}
            </dd>
          </dl>
          <p className="muted small">
            Lereng tak hingga: c&apos;={params.cohesion} kPa, φ&apos;={params.frictionAngle}°, γ={params.unitWeight} kN/m³,
            z={params.depth} m, n={params.porosity}. Kelembapan model ±10–25 km — indikator regional, bukan uji
            geoteknik lokasi.
          </p>
        </>
      )}
    </div>
  );
}
