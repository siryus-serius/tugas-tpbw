/**
 * Preset render Sentinel-1/2 (Microsoft Planetary Computer Data API, tanpa login).
 * Satu set preset dipakai untuk layer mosaik di peta DAN untuk crop perbandingan sebelum/sesudah.
 */

const PC_DATA = 'https://planetarycomputer.microsoft.com/api/data/v1';
const S2 = 'sentinel-2-l2a';
const S1 = 'sentinel-1-rtc';
const enc = (s) => s.replace(/ /g, '%20').replace(/\+/g, '%2B');

const S2_COLOR = enc('Gamma RGB 3.2 Saturation 0.8 Sigmoidal RGB 25 0.35');
const S2_COLOR_STRONG = enc('Gamma RGB 3.7 Saturation 1.5 Sigmoidal RGB 15 0.35');
const S2_HONC = enc('Gamma RGB 2.4 Saturation 1.7 Sigmoidal RGB 12 0.3');

const band = (b, max, note) => ({
  key: `s2_${b}`,
  label: b,
  group: 'Band mentah',
  sensor: 's2',
  collection: S2,
  params: `assets=${b}&rescale=0,${max}&colormap_name=gray&nodata=0`,
  rawBand: b,
  note,
});

export const PRESETS = [
  {
    key: 's2_true',
    label: 'True color',
    group: 'Visual',
    sensor: 's2',
    collection: S2,
    params: `assets=B04&assets=B03&assets=B02&nodata=0&color_formula=${S2_COLOR}`,
    note: 'Warna asli (B4-B3-B2): tutupan lahan, bekas longsor terlihat sebagai tanah terbuka cokelat.',
  },
  {
    key: 's2_false',
    label: 'False color',
    group: 'Visual',
    sensor: 's2',
    collection: S2,
    params: `assets=B08&assets=B04&assets=B03&nodata=0&color_formula=${S2_COLOR_STRONG}`,
    note: 'Inframerah (B8-B4-B3): vegetasi merah terang; area tanpa vegetasi (bekas longsor) tampak kusam/biru keabuan.',
  },
  {
    key: 's2_honc',
    label: 'Highlight Optimized Natural Color',
    group: 'Visual',
    sensor: 's2',
    collection: S2,
    params: `assets=B04&assets=B03&assets=B02&nodata=0&color_formula=${S2_HONC}`,
    note: 'Pendekatan HONC: kontras & saturasi ditingkatkan agar bukaan lahan lebih menonjol.',
  },
  {
    key: 's2_ndvi',
    label: 'NDVI',
    group: 'Indeks',
    sensor: 's2',
    collection: S2,
    params: `expression=${enc('(B08-B04)/(B08+B04)')}&rescale=0,0.9&colormap_name=rdylgn&asset_as_band=true&nodata=0`,
    note: 'Kerapatan vegetasi (B8−B4)/(B8+B4): hijau rapat, kuning/merah jarang — penurunan menandai kehilangan tutupan.',
  },
  {
    key: 's2_moisture',
    label: 'Moisture index',
    group: 'Indeks',
    sensor: 's2',
    collection: S2,
    params: `expression=${enc('(B8A-B11)/(B8A+B11)')}&rescale=-0.6,0.6&colormap_name=rdbu&asset_as_band=true&nodata=0`,
    note: 'Kelembapan vegetasi/permukaan (B8A−B11)/(B8A+B11): biru basah, merah kering.',
  },
  {
    key: 's2_ndwi',
    label: 'NDWI',
    group: 'Indeks',
    sensor: 's2',
    collection: S2,
    params: `expression=${enc('(B03-B08)/(B03+B08)')}&rescale=-0.8,0.4&colormap_name=rdbu&asset_as_band=true&nodata=0`,
    note: 'Indeks air McFeeters (B3−B8)/(B3+B8): biru = air/genangan.',
  },
  band('B01', 2500, 'Aerosol pesisir (60 m)'),
  band('B02', 3000, 'Biru (10 m)'),
  band('B03', 3000, 'Hijau (10 m)'),
  band('B04', 3000, 'Merah (10 m)'),
  band('B05', 4000, 'Red edge 1 (20 m)'),
  band('B06', 5000, 'Red edge 2 (20 m)'),
  band('B07', 5000, 'Red edge 3 (20 m)'),
  band('B08', 5000, 'NIR (10 m)'),
  band('B8A', 5000, 'NIR sempit (20 m)'),
  band('B09', 2000, 'Uap air (60 m)'),
  band('B11', 4000, 'SWIR 1 (20 m)'),
  band('B12', 4000, 'SWIR 2 (20 m)'),
  {
    key: 's1_vv',
    label: 'VV',
    group: 'Sentinel-1 radar',
    sensor: 's1',
    collection: S1,
    params: 'assets=vv&rescale=0,0.25&colormap_name=gray',
    note: 'Backscatter VV (RTC): tembus awan; perubahan tekstur/kecerahan = perubahan permukaan.',
  },
  {
    key: 's1_vh',
    label: 'VH',
    group: 'Sentinel-1 radar',
    sensor: 's1',
    collection: S1,
    params: 'assets=vh&rescale=0,0.06&colormap_name=gray',
    note: 'Backscatter VH: sensitif terhadap vegetasi; turun tajam bila vegetasi hilang.',
  },
  {
    key: 's1_rgb',
    label: 'Komposit VV/VH',
    group: 'Sentinel-1 radar',
    sensor: 's1',
    collection: S1,
    params: `expression=${enc('0.03 + log (10e-4 - log (0.05 / (0.02 + 2 * vv)));0.05 + exp (0.25 * (log (0.01 + 2 * vv) + log (0.02 + 5 * vh)));1 - log (0.05 / (0.045 - 0.9 * vv))')}&rescale=0,.8&rescale=0,1&rescale=0,1&asset_as_band=true`,
    note: 'Komposit warna palsu VV/VH (Planetary Computer).',
  },
];

export const PRESET_BY_KEY = Object.fromEntries(PRESETS.map((p) => [p.key, p]));
export const presetsFor = (sensor) => PRESETS.filter((p) => p.sensor === sensor);

/** Crop PNG satu scene di sekitar titik. */
export function cropUrl(presetKey, itemId, [lng, lat], delta = 0.015, size = 320) {
  const p = PRESET_BY_KEY[presetKey];
  if (!itemId || !p) return null;
  return `${PC_DATA}/item/bbox/${bboxStr(lng, lat, delta)}/${size}x${size}.png?collection=${p.collection}&item=${encodeURIComponent(itemId)}&${p.params}`;
}

/** Crop GeoTIFF band mentah (nilai reflektansi asli) untuk diolah di perangkat lunak GIS. */
export function rawTifUrl(presetKey, itemId, [lng, lat], delta = 0.015) {
  const p = PRESET_BY_KEY[presetKey];
  if (!itemId || !p?.rawBand) return null;
  return `${PC_DATA}/item/bbox/${bboxStr(lng, lat, delta)}.tif?collection=${p.collection}&item=${encodeURIComponent(itemId)}&assets=${p.rawBand}`;
}

/** Template URL tile mosaik (setelah pencarian didaftarkan). */
export function mosaicTileUrl(searchId, presetKey) {
  const p = PRESET_BY_KEY[presetKey];
  return `${PC_DATA}/mosaic/${searchId}/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=${p.collection}&${p.params}&format=png`;
}

const bboxStr = (lng, lat, d) => [lng - d, lat - d, lng + d, lat + d].map((v) => v.toFixed(4)).join(',');

/** Tanggal dari ID scene PC (S2 "..._MSIL2A_20210421T..." / S1 "..._20210120T111452_..."). */
export function sceneDate(itemId) {
  const m = itemId?.match(/_(\d{4})(\d{2})(\d{2})T/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '–';
}

export const PC_DATA_URL = PC_DATA;
