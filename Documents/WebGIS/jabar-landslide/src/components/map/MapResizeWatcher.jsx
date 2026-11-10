import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Perbarui ukuran peta saat kontainer berubah (mis. panel kiri dibuka/ditutup). */
export default function MapResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const obs = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    obs.observe(map.getContainer());
    return () => obs.disconnect();
  }, [map]);
  return null;
}
