import { MONTHS } from '../../config/constants';
import { PRESET_BY_KEY, PRESETS } from '../../utils/sentinelImagery';
import Checkbox from '../ui/Checkbox';

const GROUPS = [...new Set(PRESETS.map((p) => p.group))];

/** Pilihan produk citra Sentinel-1/2 dan periode (sepanjang tahun / bulan tertentu) untuk layer peta. */
export default function ImageryControls({ filters, imagery }) {
  const { layers, toggleLayer, imageryYear: year, allYears, imageryPreset, setImageryPreset, imageryMonth, setImageryMonth } = filters;
  const preset = PRESET_BY_KEY[imageryPreset];

  return (
    <section>
      <h2>Citra Sentinel</h2>
      <Checkbox checked={layers.s2} onChange={() => toggleLayer('s2')}>
        Tampilkan citra di peta
      </Checkbox>
      <label className="field">
        <span className="muted small">Produk</span>
        <select value={imageryPreset} onChange={(e) => setImageryPreset(e.target.value)}>
          {GROUPS.map((g) => (
            <optgroup key={g} label={g === 'Sentinel-1 radar' ? g : `Sentinel-2 · ${g}`}>
              {PRESETS.filter((p) => p.group === g).map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                  {p.rawBand ? ` — ${p.note}` : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="muted small">Periode ({year})</span>
        <select value={imageryMonth} onChange={(e) => setImageryMonth(Number(e.target.value))}>
          <option value={0}>Sepanjang tahun</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m} {year}
            </option>
          ))}
        </select>
      </label>
      {allYears && <p className="muted small">Mode semua tahun: citra memakai tahun terbaru ({year}).</p>}
      <p className="muted small">
        {preset?.note}{' '}
        {layers.s2 && imagery.loading && 'Memuat mosaik…'}
        {imagery.error && <span className="error">Gagal: {imagery.error}</span>}
      </p>
      {preset?.sensor === 's2' && (
        <p className="muted small">
          Mosaik memakai scene paling sedikit awan pada periode itu; area tanpa scene cerah bisa tetap berawan/kosong.
        </p>
      )}
    </section>
  );
}
