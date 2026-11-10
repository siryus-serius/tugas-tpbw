import { useMemo, useState } from 'react';
import ImageryControls from './components/controls/ImageryControls';
import LayerControls from './components/controls/LayerControls';
import Legend from './components/controls/Legend';
import StabilityControls from './components/controls/StabilityControls';
import ValidationMenu from './components/controls/ValidationMenu';
import Dashboard from './components/dashboard/Dashboard';
import EventTable from './components/dashboard/EventTable';
import Navbar from './components/layout/Navbar';
import MapToolbar from './components/map/MapToolbar';
import MapView from './components/map/MapView';
import useEarthquakes from './hooks/useEarthquakes';
import useMapFilters from './hooks/useMapFilters';
import useMonitoringPoints from './hooks/useMonitoringPoints';
import usePageScroll from './hooks/usePageScroll';
import useSentinelMosaic from './hooks/useSentinelMosaic';
import useSlopeStability from './hooks/useSlopeStability';
import useSusceptibility from './hooks/useSusceptibility';
import useTheme from './hooks/useTheme';
import useWebgisData from './hooks/useWebgisData';

const SECTIONS = [
  { id: 'peta', label: 'Peta' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'kejadian', label: 'Kejadian' },
  { id: 'validasi', label: 'Validasi' },
];
const SECTION_IDS = SECTIONS.map((s) => s.id);

/** Satu halaman yang bisa di-scroll: navbar → peta → dashboard → daftar kejadian → validasi. */
export default function App() {
  const data = useWebgisData();
  const filters = useMapFilters(data);
  const quakesLive = useEarthquakes(data.quakes);
  const points = useMonitoringPoints(data);
  const stability = useSlopeStability(points);
  const risk = useSusceptibility(points, {
    stability: stability.byId,
    yearAnomalies: filters.yearAnomalies,
    quakes: quakesLive.all,
  });
  const imagery = useSentinelMosaic({
    enabled: filters.layers.s2,
    presetKey: filters.imageryPreset,
    year: filters.year,
    month: filters.imageryMonth,
  });
  const { active, scrollTo } = usePageScroll(SECTION_IDS);
  const { theme, toggleTheme } = useTheme();
  const [selected, setSelected] = useState(null); // { type: 'event' | 'anomaly' | 'quake', feature }

  // Di peta: gempa riwayat tahun aktif + seluruh gempa BMKG terkini di sekitar Jabar
  const quakes = useMemo(() => {
    const yr = String(filters.year);
    const visible = quakesLive.all.filter((q) => q.properties.source === 'BMKG' || q.properties.time.startsWith(yr));
    return { ...quakesLive, visible };
  }, [quakesLive, filters.year]);

  const ctx = useMemo(
    () => ({ year: filters.year, colorMode: filters.colorMode, stability: stability.byId, risk }),
    [filters.year, filters.colorMode, stability.byId, risk]
  );
  const visibleIds = [
    ...(filters.layers.events ? data.events.map((f) => f.id) : []),
    ...(filters.layers.anomalies ? filters.yearAnomalies.map((f) => f.id) : []),
  ];
  const valFail = data.validation?.summary.fail ?? 0;
  const valWarn = data.validation?.summary.warn ?? 0;

  // Pilih titik dari dashboard/tabel → gulir ke peta lalu buka popup
  const selectOnMap = (sel) => {
    setSelected(sel);
    scrollTo('peta');
  };

  const toolbar = [
    {
      key: 'peta',
      label: 'Lapisan & citra',
      content: (
        <>
          <LayerControls filters={filters} />
          <ImageryControls filters={filters} imagery={imagery} />
        </>
      ),
    },
    {
      key: 'analisis',
      label: 'Analisis',
      content: (
        <StabilityControls
          colorMode={filters.colorMode}
          setColorMode={filters.setColorMode}
          visibleIds={visibleIds}
          stability={stability}
        />
      ),
    },
    { key: 'legenda', label: 'Legenda', content: <Legend colorMode={filters.colorMode} /> },
  ];

  return (
    <div className="page">
      <Navbar
        sections={SECTIONS}
        active={active}
        onNavigate={scrollTo}
        years={filters.years}
        year={filters.year}
        setYear={filters.setYear}
        theme={theme}
        onToggleTheme={toggleTheme}
        validationBadge={
          data.validation && (
            <span className={`val-badge ${valFail ? 'fail' : valWarn ? 'warn' : 'pass'}`}>
              {valFail ? '✗' : valWarn ? '!' : '✓'}
            </span>
          )
        }
      />

      <main>
        <section id="peta" className="map-section">
          <MapView
            data={data}
            filters={filters}
            imagery={imagery}
            stability={stability}
            risk={risk}
            quakes={quakes}
            selected={selected}
            onSelect={setSelected}
            theme={theme}
          />
          <MapToolbar items={toolbar} />
        </section>

        <section id="dashboard" className="content-section">
          <Dashboard data={data} filters={filters} ctx={ctx} risk={risk} quakes={quakes} onSelect={selectOnMap} />
        </section>

        <section id="kejadian" className="content-section">
          <EventTable events={data.events} stability={stability.byId} risk={risk} onSelect={selectOnMap} />
        </section>

        <section id="validasi" className="content-section">
          <div className="section-head">
            <h2>Validasi data</h2>
            <p className="muted">Hasil pemeriksaan otomatis pipeline bulanan.</p>
          </div>
          <div className="card">
            <ValidationMenu validation={data.validation} />
          </div>
        </section>

        <footer className="page-footer muted small">
          Data: BNPB/BPBD &amp; media (kejadian), BMKG (gempa terkini — Data Terbuka BMKG), USGS (riwayat gempa),
          COMET-LiCSAR (InSAR Sentinel-1), Microsoft Planetary Computer (Sentinel-1/2), Esri Wayback (citra resolusi
          tinggi), Open-Meteo (DEM Copernicus), OpenStreetMap (peta dasar).
          {data.validation && ` Data bulan ${data.validation.data_month}.`}
        </footer>
      </main>
      {data.error && <div className="toast error">Gagal memuat data: {data.error}</div>}
    </div>
  );
}
