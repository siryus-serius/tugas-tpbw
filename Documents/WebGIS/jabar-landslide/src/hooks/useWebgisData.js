import { useEffect, useState } from 'react';
import { loadJson } from '../services/dataApi';

const EMPTY = { adm: null, events: [], allEvents: [], sentinel: {}, insar: null, anomalies: [], quakes: [], validation: null };

/**
 * Memuat seluruh data statis sekali. Setiap fitur diberi `id` stabil (dipakai sebagai kunci
 * marker dan hasil Faktor Keamanan/kerawanan).
 *
 * `allEvents` = seluruh kejadian, termasuk yang tidak punya koordinat (geometry null; hanya diketahui
 * kabupaten/kotanya). `events` = kejadian berkoordinat saja — dipakai lapisan peta & analisis titik.
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
      loadJson('gempa_usgs.geojson'),
      loadJson('validation.json'),
    ]).then(([adm, ev, sentinel, summary, anomalies, quakes, validation]) => {
      if (!alive) return;
      const val = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);
      const required = [adm, ev].filter((r) => r.status === 'rejected');
      const allEvents = val(ev, { features: [] }).features.map((f) => ({ ...f, id: `ev-${f.properties.no}` }));
      setData({
        adm: val(adm, null),
        allEvents,
        events: allEvents.filter((f) => f.geometry?.coordinates),
        sentinel: val(sentinel, { events: {} }).events,
        insar: val(summary, null),
        anomalies: val(anomalies, { features: [] }).features.map((f, i) => ({
          ...f,
          id: f.properties.id ?? `an-${f.properties.year}-${i}`,
        })),
        quakes: val(quakes, { features: [] }).features.map((f) => ({ ...f, id: f.properties.id })),
        validation: val(validation, null),
      });
      setStatus({ loading: false, error: required.length ? required.map((r) => r.reason.message).join('; ') : null });
    });
    return () => {
      alive = false;
    };
  }, []);

  return { ...data, ...status };
}
