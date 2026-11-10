import { useEffect, useState } from 'react';
import { loadJson } from '../services/dataApi';

const EMPTY = { adm: null, events: [], sentinel: {}, insar: null, anomalies: [] };

/**
 * Memuat seluruh data statis sekali. Setiap fitur diberi `id` stabil (dipakai sebagai kunci
 * marker, pencarian kelembapan tanah, dan hasil Faktor Keamanan).
 */
export default function useWebgisData() {
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState({ loading: true, error: null });

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      loadJson('jabar-adm.json'),
      loadJson('longsor_jabar_2021_2026.geojson'),
      loadJson('sentinel_events.json'),
      loadJson('insar/summary.json'),
      loadJson('insar/anomalies.geojson'),
    ]).then(([adm, ev, sentinel, summary, anomalies]) => {
      if (!alive) return;
      const val = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);
      const required = [adm, ev].filter((r) => r.status === 'rejected');
      setData({
        adm: val(adm, null),
        events: val(ev, { features: [] }).features.map((f) => ({ ...f, id: `ev-${f.properties.no}` })),
        sentinel: val(sentinel, { events: {} }).events,
        insar: val(summary, null),
        anomalies: val(anomalies, { features: [] }).features.map((f, i) => ({
          ...f,
          id: f.properties.id ?? `an-${f.properties.year}-${i}`,
        })),
      });
      setStatus({ loading: false, error: required.length ? required.map((r) => r.reason.message).join('; ') : null });
    });
    return () => {
      alive = false;
    };
  }, []);

  return { ...data, ...status };
}
