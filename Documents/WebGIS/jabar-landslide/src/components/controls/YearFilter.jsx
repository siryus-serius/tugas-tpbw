export default function YearFilter({ years, year, onYear, eventCount, anomalyCount, hasAnalysis, baseline }) {
  return (
    <section>
      <h2>Tahun</h2>
      <div className="chips">
        {years.map((y) => (
          <button key={y} className={y === year ? 'chip active' : 'chip'} onClick={() => onYear(y)}>
            {y}
          </button>
        ))}
      </div>
      <p className="muted small">
        {eventCount} kejadian longsor ·{' '}
        {hasAnalysis
          ? `${anomalyCount} anomali pergeseran (dibanding ${baseline ?? 'tahun-tahun sebelumnya'})`
          : 'belum ada analisis InSAR untuk tahun ini'}
      </p>
    </section>
  );
}
