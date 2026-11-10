// Konstanta tampilan & domain yang dipakai bersama oleh komponen, hook, dan utils.

export const MAP_CENTER = [-6.9, 107.6];

export const BASEMAPS = {
  osm: {
    label: 'Jalan',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  imagery: {
    label: 'Citra',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Citra &copy; Esri',
  },
};

export const LAYERS = {
  anomalies: 'Pin anomali pergeseran (otomatis)',
  insar: 'Peta warna perubahan kecepatan (InSAR)',
  events: 'Kejadian longsor terverifikasi',
  s2: 'Mosaik Sentinel-2 tahun terpilih',
  adm: 'Batas kabupaten/kota',
};

export const DEFAULT_LAYERS = { events: true, anomalies: true, insar: true, s2: false, adm: true };

export const ORBITS = { ascending: 'Ascending', descending: 'Descending' };

/** Mode pewarnaan titik: kategori (tahun/tingkat anomali) atau Faktor Keamanan lereng. */
export const COLOR_MODES = { kategori: 'Kategori', stabilitas: 'Faktor Keamanan' };

export const SEVERITY = {
  sedang: { color: '#eab308', range: '15–30 mm/thn' },
  tinggi: { color: '#f97316', range: '30–50 mm/thn' },
  'sangat tinggi': { color: '#dc2626', range: '> 50 mm/thn' },
};

export const EVENT_COLOR = { current: '#7c3aed', other: '#94a3b8' };
export const UNKNOWN_COLOR = '#64748b';

// Mosaik tahunan Sentinel-2 cloudless (EOX), CC BY-NC-SA 4.0
export const S2_MOSAIC_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
