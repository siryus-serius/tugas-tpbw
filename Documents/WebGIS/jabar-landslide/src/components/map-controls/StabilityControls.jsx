import { COLOR_MODES } from '../../config/constants';
import { FS_CLASSES, SOIL_PARAM_FIELDS } from '../../utils/factorOfSafety';
import RadioGroup from '../ui/RadioGroup';

/**
 * Kontrol stabilitas & prediksi: mode warna titik, ringkasan kelas FK,
 * dan parameter tanah (FK dihitung ulang langsung).
 */
export default function StabilityControls({ colorMode, setColorMode, visibleIds, stability }) {
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
      <h2>Stabilitas lereng (FK) &amp; prediksi</h2>
      <div className="row">
        <span className="muted small">Warna titik</span>
        <RadioGroup options={COLOR_MODES} value={colorMode} onChange={setColorMode} />
      </div>

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
      <p className="muted small">
        FK titik yang tampil, dihitung dengan asumsi tanah lembap (rasio muka air m = {params.saturation}).
      </p>

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
