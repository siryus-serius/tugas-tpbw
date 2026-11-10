import { COLOR_MODES } from '../../config/constants';
import { FS_CLASSES, SOIL_PARAM_FIELDS } from '../../utils/factorOfSafety';
import Segmented from './Segmented';

/**
 * Kontrol stabilitas lereng: mode pewarnaan titik, ringkasan kelas FK titik yang tampil,
 * status kelembapan tanah, dan parameter tanah (FK dihitung ulang langsung).
 */
export default function StabilityControls({ colorMode, setColorMode, visibleIds, stability, moisture }) {
  const { byId, params, updateParam, resetParams } = stability;

  const counts = Object.fromEntries(FS_CLASSES.map((c) => [c.key, 0]));
  let unknown = 0;
  for (const id of visibleIds) {
    const cls = byId.get(id)?.cls;
    if (cls) counts[cls.key]++;
    else unknown++;
  }

  return (
    <section>
      <h2>Stabilitas lereng (FK)</h2>
      <div className="row">
        <span className="muted small">Warna titik</span>
        <Segmented options={COLOR_MODES} value={colorMode} onChange={setColorMode} />
      </div>

      <p className="muted small">
        Kelembapan tanah 27–81 cm (Open-Meteo):{' '}
        {moisture.status === 'loading' && 'memuat…'}
        {moisture.status === 'error' && <span className="error">gagal ({moisture.error})</span>}
        {moisture.status === 'ready' &&
          `diperbarui ${moisture.updatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
      </p>

      <div className="fs-summary">
        {FS_CLASSES.map((c) => (
          <div key={c.key} style={{ '--c': c.color }}>
            <strong>{counts[c.key]}</strong>
            <span>{c.label}</span>
          </div>
        ))}
        <div style={{ '--c': 'var(--muted)' }}>
          <strong>{unknown}</strong>
          <span>Tanpa data</span>
        </div>
      </div>
      <p className="muted small">FK minimum 72 jam ke depan untuk titik yang tampil.</p>

      <details className="params">
        <summary>Parameter tanah</summary>
        {SOIL_PARAM_FIELDS.map((f) => (
          <label key={f.key} className="slider">
            <span>
              {f.label} <strong>{params[f.key]}</strong> {f.unit}
            </span>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={params[f.key]}
              onChange={(e) => updateParam(f.key, Number(e.target.value))}
            />
          </label>
        ))}
        <button className="link" onClick={resetParams}>
          Kembalikan default (tanah residual vulkanik)
        </button>
      </details>
    </section>
  );
}
