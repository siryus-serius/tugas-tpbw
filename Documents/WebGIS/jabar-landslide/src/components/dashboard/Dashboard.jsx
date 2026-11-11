import { useMemo } from 'react';
import { eventStats } from '../../utils/eventStats';
import AnomalyList from './AnomalyList';
import PredictionList from './PredictionList';
import QuakeList from './QuakeList';
import BarChart from './BarChart';
import { isAllYears, yearLabel } from '../../utils/years';
import { galuraYears } from '../../utils/regionCounts';

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
  const s = useMemo(() => eventStats(data.allEvents), [data.allEvents]);
  const { year, years, yearAnomalies } = filters;
  const all = isAllYears(year);
  const period = yearLabel(year, years);
  const yearRow = all ? { count: s.total, deaths: s.deaths } : s.perYear.find((r) => r.key === year);
  const quakes4 = quakes.all.filter((q) => q.properties.mag >= 4).length;
  const hasAnalysis = all ? yearAnomalies.length > 0 : (data.insar?.anomaly_years?.includes(year) ?? false);
  const deadliest = s.deadliest?.properties;

  // Rekap desa Galura (DPMD): per tahun (seluruh periode dataset) & per kabupaten (periode terpilih)
  const galura = data.galura;
  const gYears = galuraYears(galura, year);
  const gLabel = gYears.length > 1 ? `${gYears[0]}–${gYears.at(-1)}` : String(gYears[0] ?? '');
  const gPerYear = useMemo(() => {
    if (!galura) return [];
    const [from, to] = galura.periode;
    return Array.from({ length: to - from + 1 }, (_, i) => from + i).map((y) => ({
      key: y,
      label: String(y),
      value: Object.values(galura.kabupaten).reduce((sum, k) => sum + (k.tahun[y] ?? 0), 0),
    }));
  }, [galura]);
  // 19 baris — cukup dihitung langsung
  const gPerKab = galura
        ? Object.values(galura.kabupaten)
            .map((k) => ({
              key: k.kode,
              label: k.nama.replace(/^Kabupaten /, ''),
              value: gYears.reduce((sum, y) => sum + (k.tahun[y] ?? 0), 0),
            }))
            .filter((r) => r.value > 0)
            .sort((a, b) => b.value - a.value)
        : [];
  const gTotal = gPerKab.reduce((sum, r) => sum + r.value, 0);

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
        <Stat value={yearRow?.count ?? 0} label={`Kejadian ${period}`} note={`${yearRow?.deaths ?? 0} korban meninggal`} />
        <Stat value={yearAnomalies.length} label={`Anomali InSAR ${period}`} note="pergeseran tanah" />
        <Stat value={quakes4} label="Gempa M≥4 sekitar Jabar" note="sejak 2021" />
        {galura && (
          <Stat
            value={gYears.length ? gTotal.toLocaleString('id-ID') : '–'}
            label={`Longsor tercatat desa ${gYears.length ? gLabel : ''}`}
            note={gYears.length ? 'Galura Data Jabar (DPMD)' : `Galura hanya ${galura.periode.join('–')}`}
          />
        )}
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
        {galura && (
          <>
            <div className="card">
              <BarChart title={`Longsor tercatat desa per tahun (Galura, ${galura.periode.join('–')})`} unit="kejadian" data={gPerYear} />
            </div>
            <div className="card">
              {gPerKab.length ? (
                <BarChart title={`Longsor tercatat desa per kabupaten/kota (Galura, ${gLabel})`} unit="kejadian" orientation="horizontal" data={gPerKab} />
              ) : (
                <p className="muted small">Data Galura belum tersedia untuk tahun terpilih (hanya {galura.periode.join('–')}).</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="panel-grid">
        <div className="card">
          <PredictionList data={data} filters={filters} risk={risk} onSelect={onSelect} />
        </div>
        <div className="card">
          {hasAnalysis ? (
            <AnomalyList year={period} anomalies={yearAnomalies} ctx={ctx} onSelect={onSelect} />
          ) : (
            <section>
              <h2>Anomali {period}</h2>
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
