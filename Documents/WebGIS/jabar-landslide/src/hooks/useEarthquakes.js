import { useEffect, useMemo, useState } from 'react';
import { fetchBmkgQuakes } from '../services/bmkgApi';

const REFRESH_MS = 5 * 60 * 1000;
// Sekitar Jawa Barat (± ~1°) — gempa di luar ini tidak relevan untuk pemicu longsor Jabar
const NEAR_JABAR = { minLng: 105.3, maxLng: 109.9, minLat: -8.9, maxLat: -5.0 };
const near = (f) => {
  const [lng, lat] = f.geometry.coordinates;
  return lng >= NEAR_JABAR.minLng && lng <= NEAR_JABAR.maxLng && lat >= NEAR_JABAR.minLat && lat <= NEAR_JABAR.maxLat;
};

/**
 * Gempa: riwayat USGS (dari pipeline) + feed BMKG terkini (live, diperbarui tiap 5 menit).
 * `all` = gabungan dekat Jabar (BMKG diutamakan bila waktu & lokasi hampir sama); `bmkgNational` = seluruh feed BMKG.
 */
export default function useEarthquakes(usgs) {
  const [bmkg, setBmkg] = useState({ list: [], status: 'idle', error: null, updatedAt: null });

  useEffect(() => {
    const ctrl = new AbortController();
    const load = () =>
      fetchBmkgQuakes(ctrl.signal)
        .then((list) => setBmkg({ list, status: 'ready', error: null, updatedAt: new Date() }))
        .catch((err) => err.name !== 'AbortError' && setBmkg((s) => ({ ...s, status: 'error', error: err.message })));
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      ctrl.abort();
      clearInterval(timer);
    };
  }, []);

  const all = useMemo(() => {
    const local = bmkg.list.filter(near);
    // Buang duplikat USGS untuk gempa yang sama (selisih < 2 menit)
    const dup = (u) => local.some((b) => Math.abs(Date.parse(b.properties.time) - Date.parse(u.properties.time)) < 120000);
    return [...local, ...usgs.filter((u) => !dup(u))].sort((a, b) => b.properties.time.localeCompare(a.properties.time));
  }, [bmkg.list, usgs]);

  return { all, bmkgLocal: bmkg.list.filter(near), bmkgNational: bmkg.list, status: bmkg.status, error: bmkg.error, updatedAt: bmkg.updatedAt };
}
