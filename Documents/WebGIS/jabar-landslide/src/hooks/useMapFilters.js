import { useMemo, useState } from 'react';
import { DEFAULT_LAYERS } from '../config/constants';

/**
 * State filter & tampilan peta beserta turunannya (tahun aktif, anomali tahun itu, overlay InSAR).
 */
export default function useMapFilters({ events, anomalies, insar }) {
  const [year, setYear] = useState(null);
  const [orbit, setOrbit] = useState('ascending');
  const [basemap, setBasemap] = useState('osm');
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [colorMode, setColorMode] = useState('kategori');
  const [imageryPreset, setImageryPreset] = useState('s2_true');
  const [imageryMonth, setImageryMonth] = useState(0); // 0 = sepanjang tahun

  const years = useMemo(() => {
    const ys = new Set(events.map((f) => f.properties.tahun));
    (insar?.anomaly_years || []).forEach((y) => ys.add(y));
    return [...ys].sort((a, b) => a - b);
  }, [events, insar]);

  // Default: tahun terbaru yang punya analisis anomali, lalu tahun kejadian terbaru
  const activeYear = year ?? insar?.anomaly_years?.at(-1) ?? years.at(-1) ?? null;

  const yearAnomalies = useMemo(
    () =>
      anomalies
        .filter((f) => f.properties.year === activeYear)
        .sort((a, b) => Math.abs(b.properties.delta_mm_yr) - Math.abs(a.properties.delta_mm_yr)),
    [anomalies, activeYear]
  );

  const yearOverlays = useMemo(
    () => (insar?.overlays || []).filter((o) => o.year === activeYear),
    [insar, activeYear]
  );
  const orbitsAvailable = useMemo(() => [...new Set(yearOverlays.map((o) => o.orbit))], [yearOverlays]);
  // Bila orbit pilihan tidak punya data di tahun ini, pakai yang tersedia
  const activeOrbit = orbitsAvailable.includes(orbit) ? orbit : (orbitsAvailable[0] ?? orbit);
  const overlays = useMemo(() => yearOverlays.filter((o) => o.orbit === activeOrbit), [yearOverlays, activeOrbit]);

  const toggleLayer = (key) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  return {
    years,
    year: activeYear,
    setYear,
    orbit: activeOrbit,
    orbitsAvailable,
    setOrbit,
    basemap,
    setBasemap,
    layers,
    toggleLayer,
    colorMode,
    setColorMode,
    imageryPreset,
    setImageryPreset,
    imageryMonth,
    setImageryMonth,
    yearAnomalies,
    overlays,
  };
}
