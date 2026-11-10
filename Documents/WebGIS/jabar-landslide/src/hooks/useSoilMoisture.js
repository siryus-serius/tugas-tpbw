import { useEffect, useState } from 'react';
import { fetchSoilMoisture } from '../services/soilMoistureApi';

const REFRESH_MS = 60 * 60 * 1000; // data model diperbarui per jam

/** Kelembapan tanah terkini + maksimum 72 jam per titik pantau; diperbarui otomatis tiap jam. */
export default function useSoilMoisture(points) {
  const [state, setState] = useState({ byId: new Map(), status: 'idle', error: null, updatedAt: null });

  useEffect(() => {
    if (!points.length) return undefined;
    const ctrl = new AbortController();
    const load = () => {
      setState((s) => ({ ...s, status: 'loading' }));
      fetchSoilMoisture(points, ctrl.signal)
        .then((byId) => setState({ byId, status: 'ready', error: null, updatedAt: new Date() }))
        .catch((err) => {
          if (err.name !== 'AbortError') setState((s) => ({ ...s, status: 'error', error: err.message }));
        });
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      ctrl.abort();
      clearInterval(timer);
    };
  }, [points]);

  return state;
}
