import { useRef } from 'react';
import useLenisScroll from '../../hooks/useLenisScroll';
import AnomalyList from '../controls/AnomalyList';
import Legend from '../controls/Legend';
import PredictionList from '../info/PredictionList';
import QuakeList from '../info/QuakeList';
import Summary from '../info/Summary';

/** Panel informasi kiri (bisa dibuka/tutup), scroll halus dengan Lenis. */
export default function InfoPanel({ open, data, filters, ctx, risk, quakes, onSelect }) {
  const scrollRef = useRef(null);
  useLenisScroll(scrollRef, open);
  const { year, yearAnomalies } = filters;
  const hasAnalysis = data.insar?.anomaly_years?.includes(year) ?? false;

  return (
    <aside className={`info-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="info-scroll" ref={scrollRef}>
        <div>
          <Summary data={data} filters={filters} quakes={quakes} />
          <PredictionList data={data} filters={filters} risk={risk} onSelect={onSelect} />
          {hasAnalysis && <AnomalyList year={year} anomalies={yearAnomalies} ctx={ctx} onSelect={onSelect} />}
          <QuakeList quakes={quakes} onSelect={onSelect} />
          <Legend colorMode={filters.colorMode} />
          <footer className="muted small">
            Data: BNPB/BPBD &amp; media (kejadian), BMKG (gempa terkini — Data Terbuka BMKG), USGS (riwayat gempa),
            COMET-LiCSAR (InSAR Sentinel-1), Microsoft Planetary Computer (Sentinel-1/2), Open-Meteo
            (DEM Copernicus untuk kemiringan lereng).
            {data.validation && ` Data bulan ${data.validation.data_month}.`}
          </footer>
        </div>
      </div>
    </aside>
  );
}
