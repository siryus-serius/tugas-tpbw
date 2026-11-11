import { BIG_DEATHS } from '../../config/constants';
import { shortKab } from '../../utils/format';
import { isAllYears } from '../../utils/years';

/**
 * Bilah linimasa di bawah peta: ▶/⏸, titik tiap tahun (bisa diklik), label tahun, dan kartu
 * "kejadian besar" (≥ BIG_DEATHS korban) pada tahun yang sedang tampil.
 */
export default function TimelinePlayer({ years, year, setYear, player, bigEvents }) {
  const { playing, toggle, stop } = player;
  const all = isAllYears(year);

  return (
    <div className={`timeline${playing ? ' is-playing' : ''}`}>
      <div className="timeline-bar">
        <button
          type="button"
          className="timeline-play"
          onClick={toggle}
          aria-label={playing ? 'Jeda linimasa' : 'Putar linimasa per tahun'}
          title={playing ? 'Jeda' : 'Putar perubahan per tahun'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
          )}
        </button>

        <ol className="timeline-track" aria-label="Tahun">
          {years.map((y) => (
            <li key={y}>
              <button
                type="button"
                className={y === year ? 'is-current' : !all && y < year ? 'is-past' : undefined}
                onClick={() => {
                  stop();
                  setYear(y);
                }}
                aria-current={y === year ? 'true' : undefined}
              >
                <span className="dot" />
                <span className="lbl">{y}</span>
              </button>
            </li>
          ))}
        </ol>

        <strong className="timeline-year" aria-live="polite">
          {all ? 'Semua' : year}
        </strong>
      </div>

      {!all && (
        <div className="timeline-big" aria-live="polite">
          {bigEvents.length ? (
            bigEvents.map((f) => (
              <span key={f.id} className="timeline-big-item">
                <i aria-hidden="true" />
                {f.properties.kecamatan}, {shortKab(f.properties.kabupaten)} — <b>{f.properties.korban_meninggal}</b> meninggal
              </span>
            ))
          ) : (
            <span className="muted">Tidak ada kejadian besar (≥ {BIG_DEATHS} korban) tercatat tahun ini.</span>
          )}
        </div>
      )}
    </div>
  );
}
