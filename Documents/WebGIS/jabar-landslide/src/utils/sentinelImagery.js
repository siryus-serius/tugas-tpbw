// URL citra Sentinel-1/2: crop bbox di-render on-the-fly oleh Microsoft Planetary Computer (tanpa login).

const PC_BBOX = 'https://planetarycomputer.microsoft.com/api/data/v1/item/bbox';

const RENDER = {
  s2rgb: {
    collection: 'sentinel-2-l2a',
    params:
      'assets=B04&assets=B03&assets=B02&nodata=0&color_formula=Gamma%20RGB%203.2%20Saturation%200.8%20Sigmoidal%20RGB%2025%200.35',
  },
  s2ndvi: {
    collection: 'sentinel-2-l2a',
    params: 'expression=(B08-B04)/(B08%2BB04)&rescale=0,0.9&colormap_name=rdylgn&asset_as_band=true&nodata=0',
  },
  s1vv: { collection: 'sentinel-1-rtc', params: 'assets=vv&rescale=0,0.25&colormap_name=gray' },
};

/** @param {'s2rgb'|'s2ndvi'|'s1vv'} kind */
export function cropUrl(kind, itemId, [lng, lat], delta = 0.015, size = 320) {
  if (!itemId) return null;
  const { collection, params } = RENDER[kind];
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].map((v) => v.toFixed(4)).join(',');
  return `${PC_BBOX}/${bbox}/${size}x${size}.png?collection=${collection}&item=${encodeURIComponent(itemId)}&${params}`;
}

/** Tanggal dari ID scene PC (S2 "..._MSIL2A_20210421T..." / S1 "..._20210120T111452_..."). */
export function sceneDate(itemId) {
  const m = itemId?.match(/_(\d{4})(\d{2})(\d{2})T/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '–';
}

export const s2MosaicUrl = (year) =>
  `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-${year}_3857/default/g/{z}/{y}/{x}.jpg`;
