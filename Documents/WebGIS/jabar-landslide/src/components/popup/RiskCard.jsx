import { WEIGHTS } from '../../utils/susceptibility';

const LABEL = {
  fk: 'Faktor Keamanan lereng',
  insar: 'Anomali pergeseran InSAR',
  gempa: 'Guncangan gempa 30 hari',
};

/** Indeks kerawanan (prediksi kualitatif) beserta kontribusi tiap komponen. */
export default function RiskCard({ risk }) {
  if (!risk) return null;
  return (
    <div className="stability" style={{ '--c': risk.cls.color }}>
      <h3>Prediksi kerawanan longsor</h3>
      <div className="fs-value">
        <span>
          Indeks <strong>{risk.index.toFixed(2)}</strong>
        </span>
        <span className="badge" style={{ background: risk.cls.color }}>
          {risk.cls.label}
        </span>
      </div>
      <ul className="bars">
        {Object.entries(risk.parts).map(([k, v]) => (
          <li key={k}>
            <span className="small">
              {LABEL[k]} <span className="muted">(bobot {WEIGHTS[k]})</span>
            </span>
            <span className="bar">
              <span style={{ width: `${Math.round(v * 100)}%`, background: risk.cls.color }} />
            </span>
          </li>
        ))}
      </ul>
      <p className="muted small">
        {risk.partial && 'FK belum tersedia → indeks dari komponen lain saja. '}
        Prediksi kualitatif; bobot heuristik, belum dikalibrasi statistik.
      </p>
    </div>
  );
}
