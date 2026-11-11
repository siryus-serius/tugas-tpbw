import { RISK_CLASSES } from '../../utils/susceptibility';

/** Daftar titik dengan indeks kerawanan tertinggi (prediksi kualitatif) di antara titik yang tampil. */
export default function PredictionList({ data, filters, risk, onSelect }) {
  const points = [
    ...data.events.map((f) => ({ f, type: 'event', name: `${f.properties.kecamatan} (longsor ${f.properties.tahun})` })),
    ...filters.yearAnomalies.map((f) => ({ f, type: 'anomaly', name: `${f.properties.wilayah} (anomali InSAR)` })),
  ]
    .map((x) => ({ ...x, r: risk.get(x.f.id) }))
    .filter((x) => x.r)
    .sort((a, b) => b.r.index - a.r.index);

  const counts = Object.fromEntries(RISK_CLASSES.map((c) => [c.key, points.filter((x) => x.r.cls.key === c.key).length]));

  return (
    <section>
      <h2>Prediksi kerawanan</h2>
      <div className="fs-summary">
        {RISK_CLASSES.map((c) => (
          <div key={c.key} style={{ '--c': c.color }}>
            <strong>{counts[c.key]}</strong>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
      <ul className="list">
        {points.slice(0, 6).map(({ f, type, name, r }) => (
          <li key={f.id}>
            <button onClick={() => onSelect({ type, feature: f })}>
              <span className="dot" style={{ background: r.cls.color }} />
              <span>{name}</span>
              <strong>{r.index.toFixed(2)}</strong>
            </button>
          </li>
        ))}
      </ul>
      <p className="muted small">Gabungan FK lereng, anomali InSAR, dan guncangan gempa terkini.</p>
    </section>
  );
}
