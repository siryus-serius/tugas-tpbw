import { useState } from 'react';
import DetailPanel from './components/detail/DetailPanel';
import MapView from './components/map/MapView';
import Sidebar from './components/sidebar/Sidebar';
import useMapFilters from './hooks/useMapFilters';
import useMonitoringPoints from './hooks/useMonitoringPoints';
import useSlopeStability from './hooks/useSlopeStability';
import useSoilMoisture from './hooks/useSoilMoisture';
import useWebgisData from './hooks/useWebgisData';

/** Komposisi: data → filter → kelembapan tanah → Faktor Keamanan → tampilan. */
export default function App() {
  const data = useWebgisData();
  const filters = useMapFilters(data);
  const points = useMonitoringPoints(data);
  const moisture = useSoilMoisture(points);
  const stability = useSlopeStability(points, moisture.byId);

  const [selected, setSelected] = useState(null); // { type: 'event' | 'anomaly', feature }
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`app ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        data={data}
        filters={filters}
        stability={stability}
        moisture={moisture}
        onSelect={setSelected}
      />
      <MapView data={data} filters={filters} stability={stability.byId} selected={selected} onSelect={setSelected} />
      {selected && (
        <DetailPanel
          selected={selected}
          sentinel={data.sentinel}
          stability={stability}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
