import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BASEMAPS, MAP_CENTER, S2_MOSAIC_YEARS } from '../../config/constants';
import { s2MosaicUrl } from '../../utils/sentinelImagery';
import AnomalyLayer from './AnomalyLayer';
import EventLayer from './EventLayer';
import FlyToSelected from './FlyToSelected';
import InsarOverlayLayer from './InsarOverlayLayer';

const ADM_STYLE = { color: '#64748b', weight: 1, fillOpacity: 0, interactive: false };

export default function MapView({ data, filters, stability, selected, onSelect }) {
  const { basemap, layers, year, overlays, yearAnomalies, colorMode } = filters;
  const bm = BASEMAPS[basemap];
  const selectedId = selected?.feature.id;

  return (
    <MapContainer className="map" center={MAP_CENTER} zoom={8} minZoom={7} preferCanvas>
      <TileLayer key={basemap} url={bm.url} attribution={bm.attribution} />

      {layers.s2 && S2_MOSAIC_YEARS.includes(year) && (
        <TileLayer
          key={`s2-${year}`}
          url={s2MosaicUrl(year)}
          opacity={0.9}
          attribution={`Sentinel-2 cloudless ${year} &copy; <a href="https://s2maps.eu">EOX</a> (Copernicus Sentinel data)`}
        />
      )}

      {layers.adm && data.adm && <GeoJSON data={data.adm} style={ADM_STYLE} />}

      {layers.insar && <InsarOverlayLayer overlays={overlays} />}

      {layers.events && (
        <EventLayer
          events={data.events}
          year={year}
          colorMode={colorMode}
          stability={stability}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}

      {layers.anomalies && (
        <AnomalyLayer
          anomalies={yearAnomalies}
          colorMode={colorMode}
          stability={stability}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}

      <FlyToSelected selected={selected} />
    </MapContainer>
  );
}
