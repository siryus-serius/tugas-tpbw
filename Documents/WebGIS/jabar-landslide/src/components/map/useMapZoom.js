import { useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

/** Tingkat zoom peta terkini (diperbarui setiap selesai zoom). Harus dipakai di dalam MapContainer. */
export default function useMapZoom() {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  return zoom;
}
