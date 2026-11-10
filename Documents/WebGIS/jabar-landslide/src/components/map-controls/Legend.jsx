import { EVENT_COLOR, QUAKE_COLOR, SEVERITY, UNKNOWN_COLOR } from '../../config/constants';
import { FS_CLASSES } from '../../utils/factorOfSafety';
import { RISK_CLASSES } from '../../utils/susceptibility';

const Dot = ({ color, small }) => <span className={`dot${small ? ' small' : ''}`} style={{ background: color }} />;
const Pin = ({ color }) => <span className="anomaly-pin static" style={{ '--c': color }} />;

export default function Legend({ colorMode }) {
  return (
    <section>
      <h2>Legenda</h2>
      {colorMode === 'kerawanan' && (
        <>
          {RISK_CLASSES.map((c) => (
            <div key={c.key} className="legend-row">
              <Dot color={c.color} /> Kerawanan {c.label.toLowerCase()}
            </div>
          ))}
          <div className="legend-row">
            <Dot color={UNKNOWN_COLOR} /> Data belum cukup
          </div>
        </>
      )}
      {colorMode === 'stabilitas' && (
        <>
          {FS_CLASSES.map((c) => (
            <div key={c.key} className="legend-row">
              <Dot color={c.color} /> {c.label}
              <span className="muted small">
                {c.key === 'labil' ? ' FK < 1,07' : c.key === 'kritis' ? ' 1,07–1,25' : ' > 1,25'} · {c.note}
              </span>
            </div>
          ))}
          <div className="legend-row">
            <Dot color={UNKNOWN_COLOR} /> Data kemiringan lereng belum ada
          </div>
          <p className="muted small">Bulat = kejadian longsor, berdenyut = anomali InSAR. Klasifikasi Bowles (1989).</p>
        </>
      )}
      {colorMode === 'kategori' && (
        <>
          <div className="legend-row">
            <Dot color={EVENT_COLOR.current} /> Kejadian longsor tahun terpilih
          </div>
          <div className="legend-row">
            <Dot color={EVENT_COLOR.other} small /> Kejadian tahun lain
          </div>
          {Object.entries(SEVERITY).map(([s, { color, range }]) => (
            <div key={s} className="legend-row">
              <Pin color={color} /> Anomali {s} <span className="muted small">({range})</span>
            </div>
          ))}
        </>
      )}
      <div className="legend-row">
        <span className="ring" style={{ borderColor: QUAKE_COLOR.BMKG }} /> Gempa BMKG terkini
      </div>
      <div className="legend-row">
        <span className="ring" style={{ borderColor: QUAKE_COLOR.USGS }} /> Gempa riwayat USGS (tahun terpilih), ukuran ∝ magnitudo
      </div>
      <div className="ramp" />
      <div className="ramp-labels muted small">
        <span>menjauhi satelit (turun)</span>
        <span>mendekati</span>
      </div>
      <p className="muted small">Δ kecepatan LOS vs rata-rata tahun sebelumnya; |Δ| &lt; 15 mm/thn tidak diwarnai.</p>
    </section>
  );
}
