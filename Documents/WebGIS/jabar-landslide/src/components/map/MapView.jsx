import { useMemo } from 'react';
import { GeoJSON, MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BASEMAPS, MAP_CENTER } from '../../config/constants';
import { buildKabupatenIndex, countByKabupaten } from '../../utils/kabupaten';
import { inYear, yearLabel } from '../../utils/years';
import AnomalyLayer from './AnomalyLayer';
import EventsByZoom from './EventsByZoom';
import FlyToSelected from './FlyToSelected';
import HeatLayer from './HeatLayer';
import InsarOverlayLayer from './InsarOverlayLayer';
import MapResizeWatcher from './MapResizeWatcher';
import QuakeLayer from './QuakeLayer';
import SelectedPopup from './SelectedPopup';

const ADM_STYLE = { color: '#64748b', weight: 1, fillOpacity: 0, interactive: false };

export default function MapView({ data, filters, imagery, stability, risk, quakes, selected, onSelect, theme }) {
  const { basemap, layers, year, years, overlays, yearAnomalies, colorMode } = filters;
  const bm = BASEMAPS[basemap];
  const selectedId = selected?.feature.id;
  const ctx = useMemo(() => ({ year, colorMode, stability: stability.byId, risk }), [year, colorMode, stability.byId, risk]);

  // Kejadian pada periode terpilih (satu tahun atau seluruh tahun) → peta panas & angka per kabupaten
  const kabIndex = useMemo(() => buildKabupatenIndex(data.adm), [data.adm]);
  const periodEvents = useMemo(() => data.events.filter((f) => inYear(f.properties.tahun, year)), [data.events, year]);
  const kabGroups = useMemo(() => countByKabupaten(periodEvents, kabIndex), [periodEvents, kabIndex]);
  const heatPoints = useMemo(
    () => periodEvents.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0], 1]),
    [periodEvents]
  );

  return (
    <MapContainer className="map" center={MAP_CENTER} zoom={8} minZoom={7} preferCanvas zoomControl={false}>
      <ZoomControl position="bottomright" />
      <TileLayer
        key={`${basemap}-${theme}`}
        url={bm.url}
        attribution={bm.attribution}
        className={bm.themed ? `tiles-themed tiles-${theme}` : undefined}
      />

      {imagery.url && (
        <TileLayer
          key={imagery.url}
          url={imagery.url}
          opacity={0.9}
          maxNativeZoom={14}
          attribution="Copernicus Sentinel data, render: Microsoft Planetary Computer"
        />
      )}

      {layers.adm && data.adm && <GeoJSON data={data.adm} style={ADM_STYLE} />}
      {layers.insar && <InsarOverlayLayer overlays={overlays} />}
      {layers.heat && <HeatLayer points={heatPoints} />}
      {layers.quakes && <QuakeLayer quakes={quakes.visible} selectedId={selectedId} onSelect={onSelect} />}
      {layers.events && (
        <EventsByZoom
          events={data.events}
          groups={kabGroups}
          periodLabel={yearLabel(year, years)}
          ctx={ctx}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}
      {layers.anomalies && <AnomalyLayer anomalies={yearAnomalies} ctx={ctx} selectedId={selectedId} onSelect={onSelect} />}

      {selected && (
        <SelectedPopup
          selected={selected}
          data={data}
          stability={stability}
          risk={risk}
          quakes={quakes.all}
          onClose={(id) => onSelect((s) => (s?.feature.id === id ? null : s))}
        />
      )}
      <FlyToSelected selected={selected} />
      <MapResizeWatcher />
    </MapContainer>
  );
}
