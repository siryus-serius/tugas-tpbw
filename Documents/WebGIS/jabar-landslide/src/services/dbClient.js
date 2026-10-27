/**
 * CLIENT DATABASE SERVICE (INDEXEDDB & EDGE SQLITE ADAPTER)
 * File: src/services/dbClient.js
 * 
 * Mengelola database browser lokal (IndexedDB) untuk:
 * - Penyimpanan permanen offline Laporan Lapangan Warga (Citizen Science)
 * - Caching telemetri satelit & stasiun cuaca
 * - Ekspor ke format GeoJSON / CSV
 * - Interaksi dengan data snapshot SQLite v3
 */

const DB_NAME = 'JabarGeoriskClientDB';
const DB_VERSION = 1;

/**
 * Inisialisasi IndexedDB Browser
 */
export function openClientDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB tidak didukung pada browser ini.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Store Laporan Warga / Petugas Lapangan
      if (!db.objectStoreNames.contains('citizen_reports')) {
        const store = db.createObjectStore('citizen_reports', { keyPath: 'id' });
        store.createIndex('created_at', 'created_at', { unique: false });
        store.createIndex('severity', 'severity', { unique: false });
        store.createIndex('region', 'region', { unique: false });
      }

      // 2. Store Cache Telemetri
      if (!db.objectStoreNames.contains('telemetry_cache')) {
        db.createObjectStore('telemetry_cache', { keyPath: 'station_id' });
      }

      // 3. Store Bookmark Wilayah Pengguna
      if (!db.objectStoreNames.contains('bookmarks')) {
        db.createObjectStore('bookmarks', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Simpan Laporan Lapangan Warga ke IndexedDB
 */
export async function saveCitizenReport(reportData) {
  const db = await openClientDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('citizen_reports', 'readwrite');
    const store = tx.objectStore('citizen_reports');

    const id = reportData.id || `REP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const record = {
      id,
      created_at: reportData.created_at || new Date().toISOString(),
      name: reportData.name || 'Warga Anonim',
      phone: reportData.phone || '-',
      region: reportData.region || 'Kab. Cianjur',
      coords: reportData.coords || '-6.82, 107.10',
      description: reportData.description || 'Laporan pergerakan tanah atau potensi longsor.',
      severity: reportData.severity || 'Tinggi',
      sync_status: 'Tersimpan di Database Lokal'
    };

    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = (err) => reject(err);
  });
}

/**
 * Ambil Semua Laporan Warga dari IndexedDB
 */
export async function getAllCitizenReports() {
  try {
    const db = await openClientDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('citizen_reports', 'readonly');
      const store = tx.objectStore('citizen_reports');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (err) => reject(err);
    });
  } catch (err) {
    console.warn('Gagal membaca IndexedDB:', err.message);
    return [];
  }
}

/**
 * Hapus Laporan dari IndexedDB
 */
export async function deleteCitizenReport(id) {
  const db = await openClientDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('citizen_reports', 'readwrite');
    const store = tx.objectStore('citizen_reports');
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = (err) => reject(err);
  });
}

/**
 * Fetch Ringkasan Database SQLite dari file snapshot JSON
 */
export async function fetchDatabaseSummary() {
  try {
    const res = await fetch('/data/database-summary.json?t=' + Date.now());
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Gagal memuat database-summary.json:', err.message);
  }
  return null;
}

/**
 * Ekspor Semua Laporan ke GeoJSON FeatureCollection
 */
export async function exportReportsAsGeoJSON() {
  const reports = await getAllCitizenReports();
  const features = reports.map((r) => {
    const parts = (r.coords || '').split(',').map(s => parseFloat(s.trim()));
    const lat = isNaN(parts[0]) ? -6.82 : parts[0];
    const lng = isNaN(parts[1]) ? 107.10 : parts[1];

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        id: r.id,
        created_at: r.created_at,
        name: r.name,
        phone: r.phone,
        region: r.region,
        severity: r.severity,
        description: r.description
      }
    };
  });

  const geojson = {
    type: 'FeatureCollection',
    name: 'Laporan_Warga_Longsor_Jabar',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan-longsor-jabar-${new Date().toISOString().slice(0, 10)}.geojson`;
  a.click();
  URL.revokeObjectURL(url);
}
