import { ImageOverlay } from 'react-leaflet';
import { dataUrl } from '../../services/dataApi';

/** Peta warna Δ kecepatan InSAR (PNG per frame/tahun hasil pipeline). */
export default function InsarOverlayLayer({ overlays }) {
  return overlays.map((o) => (
    <ImageOverlay
      key={o.url}
      url={dataUrl(o.url)}
      bounds={o.bounds}
      opacity={0.85}
      className="pixelated"
      attribution="InSAR: COMET-LiCSAR (Copernicus Sentinel-1)"
    />
  ));
}
