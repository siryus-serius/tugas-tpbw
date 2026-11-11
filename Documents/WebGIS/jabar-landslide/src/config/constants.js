// Konstanta tampilan & domain yang dipakai bersama oleh komponen, hook, dan utils.

export const MAP_CENTER = [-6.9, 107.6];

/** Titik acuan Jawa Barat (Bandung) untuk globe & koordinat di halaman pembuka. */
export const JABAR = { lat: -6.9147, lon: 107.6098 };

export const BASEMAPS = {
  osm: {
    label: 'Jalan',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    themed: true, // diberi filter warna retro sesuai tema (lihat .tiles-themed di index.css)
  },
  imagery: {
    label: 'Citra',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Citra &copy; Esri',
  },
};

export const LAYERS = {
  heat: 'Peta panas kepadatan kejadian longsor',
  anomalies: 'Pin anomali pergeseran (otomatis)',
  insar: 'Peta warna perubahan kecepatan (InSAR)',
  events: 'Kejadian longsor terverifikasi',
  quakes: 'Gempa bumi (BMKG terkini + riwayat USGS)',
  adm: 'Batas kabupaten/kota',
};

export const DEFAULT_LAYERS = { heat: true, events: true, anomalies: true, insar: true, quakes: true, s2: false, adm: true };

export const ORBITS = { ascending: 'Ascending', descending: 'Descending' };

/** Mode pewarnaan titik: kategori (tahun/tingkat anomali) atau Faktor Keamanan lereng. */
export const COLOR_MODES = { kategori: 'Kategori', stabilitas: 'FK', kerawanan: 'Kerawanan' };

export const SEVERITY = {
  sedang: { color: '#eab308', range: '15–30 mm/thn' },
  tinggi: { color: '#f97316', range: '30–50 mm/thn' },
  'sangat tinggi': { color: '#dc2626', range: '> 50 mm/thn' },
};

export const EVENT_COLOR = { current: '#7c3aed', other: '#94a3b8' };
export const UNKNOWN_COLOR = '#64748b';
export const QUAKE_COLOR = { BMKG: '#e11d48', USGS: '#0ea5e9' };

/** Ambang "kejadian longsor besar" (jumlah korban meninggal) untuk linimasa & penanda berdenyut. */
export const BIG_DEATHS = 5;

/** Pada zoom ≤ nilai ini, titik kejadian digabung menjadi angka per kabupaten/kota. */
export const AGGREGATE_MAX_ZOOM = 8;

/** Kelas jumlah kejadian per kabupaten/kota (simbol angka saat peta diperkecil). */
export const COUNT_CLASSES = [
  { max: 1, label: '1 kejadian', color: '#fecc5c', ink: '#151512' },
  { max: 3, label: '2–3 kejadian', color: '#fd8d3c', ink: '#151512' },
  { max: 5, label: '4–5 kejadian', color: '#e8501e', ink: '#ffffff' },
  { max: Infinity, label: '≥ 6 kejadian', color: '#b10026', ink: '#ffffff' },
];
export const countClass = (n) => COUNT_CLASSES.find((c) => n <= c.max);

/** Gradasi peta panas (YlOrRd): rendah → tinggi. */
export const HEAT_GRADIENT = { 0.2: '#ffffb2', 0.4: '#fecc5c', 0.6: '#fd8d3c', 0.8: '#f03b20', 1: '#bd0026' };

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
