import { useMemo } from 'react';
import { eventStats } from '../../utils/eventStats';
import AnomalyList from '../controls/AnomalyList';
import PredictionList from '../info/PredictionList';
import QuakeList from '../info/QuakeList';
import BarChart from './BarChart';

function Stat({ value, label, note }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
      {note && <em>{note}</em>}
    </div>
  );
}

/** Dashboard data kejadian: angka utama, grafik, prediksi, anomali, dan gempa terkini. */
export default function Dashboard({ data, filters, ctx, risk, quakes, onSelect }) {
  const s = useMemo(() => eventStats(data.events), [data.events]);
  const { year, yearAnomalies } = filters;
  const yearRow = s.perYear.find((r) => r.key === year);
  const quakes4 = quakes.all.filter((q) => q.properties.mag >= 4).length;
  const hasAnalysis = data.insar?.anomaly_years?.includes(year) ?? false;
  const deadliest = s.deadliest?.properties;

  return (
    <>
      <div className="section-head">
        <h2>Dashboard kejadian longsor</h2>
        <p className="muted">
          Rekap {s.total} kejadian terverifikasi 2021–2026 di Jawa Barat. Kartu bertanda tahun mengikuti pemilih tahun di
          navbar.
        </p>
      </div>

      <div className="stat-row">
        <Stat value={s.total} label="Kejadian longsor" note="2021–2026" />
        <Stat value={s.deaths} label="Korban meninggal" note="seluruh kejadian" />
        <Stat value={s.kabupaten} label="Kabupaten/kota terdampak" note="dari 27" />
        <Stat value={yearRow?.count ?? 0} label={`Kejadian ${year}`} note={`${yearRow?.deaths ?? 0} korban meninggal`} />
        <Stat value={yearAnomalies.length} label={`Anomali InSAR ${year}`} note="pergeseran tanah" />
        <Stat value={quakes4} label="Gempa M≥4 sekitar Jabar" note="sejak 2021" />
      </div>

      {deadliest && (
        <p className="callout">
          Kejadian paling mematikan: <strong>{deadliest.kecamatan}, {deadliest.kabupaten}</strong> ({deadliest.tanggal}) —{' '}
          {deadliest.korban_meninggal} korban meninggal.{' '}
          <button className="link" onClick={() => onSelect({ type: 'event', feature: s.deadliest })}>
            Lihat di peta
          </button>
        </p>
      )}

      <div className="chart-grid">
        <div className="card">
          <BarChart
            title="Jumlah kejadian per tahun"
            unit="kejadian"
            data={s.perYear.map((r) => ({ key: r.key, label: r.label, value: r.count, detail: `${r.deaths} korban meninggal` }))}
          />
        </div>
        <div className="card">
          <BarChart
            title="Korban meninggal per tahun"
            unit="jiwa"
            data={s.perYear.map((r) => ({ key: r.key, label: r.label, value: r.deaths, detail: `${r.count} kejadian` }))}
          />
        </div>
        <div className="card">
          <BarChart title="Kejadian per bulan (pola musiman)" unit="kejadian" data={s.perMonth} />
        </div>
        <div className="card">
          <BarChart title="Kejadian per kabupaten/kota" unit="kejadian" orientation="horizontal" data={s.perKab} />
        </div>
      </div>

      <div className="panel-grid">
        <div className="card">
          <PredictionList data={data} filters={filters} risk={risk} onSelect={onSelect} />
        </div>
        <div className="card">
          {hasAnalysis ? (
            <AnomalyList year={year} anomalies={yearAnomalies} ctx={ctx} onSelect={onSelect} />
          ) : (
            <section>
              <h2>Anomali {year}</h2>
              <p className="muted small">Belum ada analisis InSAR untuk tahun ini.</p>
            </section>
          )}
        </div>
        <div className="card">
          <QuakeList quakes={quakes} onSelect={onSelect} />
        </div>
      </div>
    </>
  );
}
