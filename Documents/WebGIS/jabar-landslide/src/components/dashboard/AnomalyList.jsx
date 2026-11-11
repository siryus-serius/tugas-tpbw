import { signed } from '../../utils/format';
import { anomalyColor } from '../../utils/markerColors';
import { usePager } from '../ui/Pager';

export default function AnomalyList({ year, anomalies, ctx, onSelect }) {
  const { pageItems, pager } = usePager(anomalies);
  return (
    <section>
      <h2>Anomali {year}</h2>
      {anomalies.length === 0 ? (
        <p className="muted small">Tidak ada anomali signifikan di area lereng.</p>
      ) : (
        <ul className="list">
          {pageItems.map((f) => (
            <li key={f.id}>
              <button onClick={() => onSelect({ type: 'anomaly', feature: f })}>
                <span className="anomaly-pin static" style={{ '--c': anomalyColor(f, ctx) }} />
                <span>
                  {f.properties.wilayah}
                  <span className="muted small"> · {f.properties.area_ha} ha</span>
                </span>
                <strong>{signed(f.properties.delta_mm_yr)}</strong>
              </button>
            </li>
          ))}
        </ul>
      )}
      {pager}
    </section>
  );
}
