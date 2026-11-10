import { useMemo, useState } from 'react';
import ImageryControls from './components/controls/ImageryControls';
import LayerControls from './components/controls/LayerControls';
import StabilityControls from './components/controls/StabilityControls';
import ValidationMenu from './components/controls/ValidationMenu';
import InfoPanel from './components/layout/InfoPanel';
import TopBar from './components/layout/TopBar';
import MapView from './components/map/MapView';
import useEarthquakes from './hooks/useEarthquakes';
import useMapFilters from './hooks/useMapFilters';
import useMonitoringPoints from './hooks/useMonitoringPoints';
import useSentinelMosaic from './hooks/useSentinelMosaic';
import useSlopeStability from './hooks/useSlopeStability';
import useSusceptibility from './hooks/useSusceptibility';
import useWebgisData from './hooks/useWebgisData';

/** Komposisi: data → filter → gempa → FK (skenario) → kerawanan → tampilan. */
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

  // Di peta: gempa riwayat tahun aktif + seluruh gempa BMKG terkini di sekitar Jabar
  const quakes = useMemo(() => {
    const yr = String(filters.year);
    const visible = quakesLive.all.filter((q) => q.properties.source === 'BMKG' || q.properties.time.startsWith(yr));
    return { ...quakesLive, visible };
  }, [quakesLive, filters.year]);

  const [selected, setSelected] = useState(null); // { type: 'event' | 'anomaly' | 'quake', feature }
  const [panelOpen, setPanelOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const [openMenu, setOpenMenu] = useState(null);

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

  const menus = [
    {
      key: 'peta',
      icon: '🗺️',
      label: 'Peta & Citra',
      content: (
        <>
          <LayerControls filters={filters} />
          <ImageryControls filters={filters} imagery={imagery} />
        </>
      ),
    },
    {
      key: 'analisis',
      icon: '📊',
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
    {
      key: 'validasi',
      icon: '✅',
      label: 'Validasi',
      badge: data.validation && (
        <span className={`val-badge ${valFail ? 'fail' : valWarn ? 'warn' : 'pass'}`}>
          {valFail ? '✗' : valWarn ? '!' : '✓'}
        </span>
      ),
      content: <ValidationMenu validation={data.validation} />,
    },
  ];

  return (
    <div className="app">
      <TopBar
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((o) => !o)}
        years={filters.years}
        year={filters.year}
        setYear={filters.setYear}
        menus={menus}
        openKey={openMenu}
        setOpenKey={setOpenMenu}
      />
      <div className="workspace">
        <InfoPanel
          open={panelOpen}
          data={data}
          filters={filters}
          ctx={ctx}
          risk={risk}
          quakes={quakes}
          onSelect={setSelected}
        />
        <MapView
          data={data}
          filters={filters}
          imagery={imagery}
          stability={stability}
          risk={risk}
          quakes={quakes}
          selected={selected}
          onSelect={setSelected}
        />
      </div>
      {data.error && <div className="toast error">Gagal memuat data: {data.error}</div>}
    </div>
  );
}
