import { SATURATION_SCENARIOS, formatFS } from '../../utils/factorOfSafety';

/** Kartu Faktor Keamanan satu titik: kemiringan + parameter tanah + skenario kejenuhan → FK. */
export default function StabilityCard({ result, params, slopeSource }) {
  if (!result) return null;
  const { slopeDeg, m, fs, cls } = result;

  return (
    <div className="stability" style={{ '--c': cls?.color ?? 'var(--line)' }}>
      <h3>Stabilitas lereng (skenario {SATURATION_SCENARIOS[m] ?? 'm=' + m})</h3>
      {slopeDeg == null ? (
        <p className="muted small">FK belum dapat dihitung: data kemiringan lereng belum tersedia.</p>
      ) : (
        <>
          <div className="fs-value">
            <span>
              FK <strong>{formatFS(fs)}</strong>
            </span>
            <span className="badge" style={{ background: cls.color }}>
              {cls.label}
            </span>
          </div>
          <dl>
            <dt>Kemiringan β</dt>
            <dd>
              {slopeDeg}° <span className="muted small">({slopeSource})</span>
            </dd>
            <dt>Rasio muka air m</dt>
            <dd>{m} (skenario, bukan pengukuran)</dd>
          </dl>
          <p className="muted small">
            Lereng tak hingga: c&apos;={params.cohesion} kPa, φ&apos;={params.frictionAngle}°, γ={params.unitWeight} kN/m³,
            z={params.depth} m. Ubah skenario &amp; parameter di menu &quot;Stabilitas &amp; Prediksi&quot;. Indikator
            regional, bukan pengganti uji geoteknik.
          </p>
        </>
      )}
    </div>
  );
}
