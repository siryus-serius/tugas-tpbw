import AnomalyList from './AnomalyList';
import LayerControls from './LayerControls';
import Legend from './Legend';
import StabilityControls from './StabilityControls';
import YearFilter from './YearFilter';

export default function Sidebar({ open, onToggle, data, filters, stability, moisture, onSelect }) {
  const { year, yearAnomalies, layers, colorMode, setColorMode } = filters;
  const hasAnalysis = data.insar?.anomaly_years?.includes(year) ?? false;
  const yearEvents = data.events.filter((f) => f.properties.tahun === year);

  // Titik yang sedang tampil di peta → dasar ringkasan kelas FK
  const visibleIds = [
    ...(layers.events ? data.events.map((f) => f.id) : []),
    ...(layers.anomalies ? yearAnomalies.map((f) => f.id) : []),
  ];

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <button className="sidebar-toggle" onClick={onToggle} aria-label={open ? 'Tutup panel' : 'Buka panel'}>
        {open ? '‹' : '›'}
      </button>
      <div className="sidebar-body">
        <header>
          <h1>Longsor &amp; Pergeseran Tanah Jawa Barat</h1>
          <p className="muted">Sentinel-1 (InSAR) &amp; Sentinel-2 · kelembapan tanah · Faktor Keamanan lereng</p>
        </header>

        {data.error && <p className="error">Gagal memuat data: {data.error}</p>}

        <YearFilter
          years={filters.years}
          year={year}
          onYear={filters.setYear}
          eventCount={yearEvents.length}
          anomalyCount={yearAnomalies.length}
          hasAnalysis={hasAnalysis}
          baseline={yearAnomalies[0]?.properties.baseline_years}
        />
        <LayerControls filters={filters} />
        <StabilityControls
          colorMode={colorMode}
          setColorMode={setColorMode}
          visibleIds={visibleIds}
          stability={stability}
          moisture={moisture}
        />
        <Legend colorMode={colorMode} />
        {hasAnalysis && (
          <AnomalyList
            year={year}
            anomalies={yearAnomalies}
            colorMode={colorMode}
            stability={stability.byId}
            onSelect={onSelect}
          />
        )}

        <footer className="muted small">
          Data: BNPB/BPBD (kejadian), COMET-LiCSAR (InSAR Sentinel-1), Microsoft Planetary Computer &amp; EOX
          (Sentinel-1/2), Open-Meteo (kelembapan tanah &amp; DEM Copernicus). Analisis InSAR diperbarui tiap minggu
          {data.insar?.generated_at && ` · terakhir ${new Date(data.insar.generated_at).toLocaleDateString('id-ID')}`}.
        </footer>
      </div>
    </aside>
  );
}
