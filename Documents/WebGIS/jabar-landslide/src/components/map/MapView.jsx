import { useMemo } from 'react';
import { GeoJSON, MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BASEMAPS, MAP_CENTER } from '../../config/constants';
import AnomalyLayer from './AnomalyLayer';
import EventLayer from './EventLayer';
import FlyToSelected from './FlyToSelected';
import InsarOverlayLayer from './InsarOverlayLayer';
import MapResizeWatcher from './MapResizeWatcher';
import QuakeLayer from './QuakeLayer';
import SelectedPopup from './SelectedPopup';

const ADM_STYLE = { color: '#64748b', weight: 1, fillOpacity: 0, interactive: false };

export default function MapView({ data, filters, imagery, stability, risk, quakes, selected, onSelect }) {
  const { basemap, layers, year, overlays, yearAnomalies, colorMode } = filters;
  const bm = BASEMAPS[basemap];
  const selectedId = selected?.feature.id;
  const ctx = useMemo(() => ({ year, colorMode, stability: stability.byId, risk }), [year, colorMode, stability.byId, risk]);

  return (
    <MapContainer className="map" center={MAP_CENTER} zoom={8} minZoom={7} preferCanvas zoomControl={false}>
      <ZoomControl position="bottomright" />
      <TileLayer key={basemap} url={bm.url} attribution={bm.attribution} />

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
      {layers.quakes && <QuakeLayer quakes={quakes.visible} selectedId={selectedId} onSelect={onSelect} />}
      {layers.events && <EventLayer events={data.events} ctx={ctx} selectedId={selectedId} onSelect={onSelect} />}
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
