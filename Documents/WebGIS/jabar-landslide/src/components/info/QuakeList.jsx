import { QUAKE_COLOR } from '../../config/constants';

const WIB = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' };

/** Gempa terkini dari BMKG di sekitar Jawa Barat (live). */
export default function QuakeList({ quakes, onSelect }) {
  const list = quakes.bmkgLocal.slice(0, 6);
  return (
    <section>
      <h2>Gempa terkini sekitar Jabar (BMKG)</h2>
      {quakes.status === 'error' && <p className="error small">Feed BMKG gagal dimuat: {quakes.error}</p>}
      {quakes.status !== 'error' && list.length === 0 && (
        <p className="muted small">Tidak ada gempa M≥5 / dirasakan di sekitar Jabar pada feed BMKG terkini.</p>
      )}
      <ul className="list">
        {list.map((f) => (
          <li key={f.id}>
            <button onClick={() => onSelect({ type: 'quake', feature: f })}>
              <span className="dot" style={{ background: QUAKE_COLOR.BMKG }} />
              <span>
                {f.properties.place}
                <span className="muted small"> · {new Date(f.properties.time).toLocaleString('id-ID', WIB)}</span>
              </span>
              <strong>M{f.properties.mag}</strong>
            </button>
          </li>
        ))}
      </ul>
      {quakes.updatedAt && (
        <p className="muted small">
          Sumber: BMKG, diperbarui {quakes.updatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.
        </p>
      )}
    </section>
  );
}
