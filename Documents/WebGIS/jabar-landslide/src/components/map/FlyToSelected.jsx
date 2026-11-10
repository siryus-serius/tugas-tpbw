import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function FlyToSelected({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (!selected) return;
    const [lng, lat] = selected.feature.geometry.coordinates;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 12), { duration: 0.8 });
  }, [selected, map]);
  return null;
}
