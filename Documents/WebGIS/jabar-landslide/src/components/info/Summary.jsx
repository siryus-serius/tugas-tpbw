/** Ringkasan angka untuk tahun aktif. */
export default function Summary({ data, filters, quakes }) {
  const { year, yearAnomalies } = filters;
  const events = data.events.filter((f) => f.properties.tahun === year);
  const deaths = events.reduce((s, f) => s + (f.properties.korban_meninggal ?? 0), 0);
  const yearQuakes = quakes.all.filter((q) => q.properties.time.startsWith(String(year)));

  const stats = [
    { label: 'Kejadian longsor', value: events.length },
    { label: 'Korban meninggal', value: deaths },
    { label: 'Anomali InSAR', value: yearAnomalies.length },
    { label: 'Gempa M≥3,5', value: yearQuakes.length },
  ];

  return (
    <section>
      <h2>Ringkasan {year}</h2>
      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <p className="muted small">Total arsip: {data.events.length} kejadian longsor terverifikasi 2021–2026.</p>
    </section>
  );
}
