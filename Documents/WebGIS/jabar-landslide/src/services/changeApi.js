/**
 * Mengambil crop GeoTIFF B04/B08/SCL dua scene Sentinel-2 dari Planetary Computer (tanpa login)
 * lalu menghitung peta kehilangan vegetasi di browser. geotiff dimuat dinamis (tidak membebani awal).
 */
import { PC_DATA_URL } from '../utils/sentinelImagery';
import { vegetationLoss } from '../utils/changeDetection';

const SIZE = 512; // ±0,05° → ±10 m/piksel (resolusi asli Sentinel-2)

async function readScene(itemId, bbox, signal) {
  const { fromArrayBuffer } = await import('geotiff');
  const url = `${PC_DATA_URL}/item/bbox/${bbox.join(',')}/${SIZE}x${SIZE}.tif?collection=sentinel-2-l2a&item=${encodeURIComponent(itemId)}&assets=B04&assets=B08&assets=SCL`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Planetary Computer HTTP ${res.status}`);
  const img = await (await fromArrayBuffer(await res.arrayBuffer())).getImage();
  const [b04, b08, scl] = await img.readRasters();
  return { b04, b08, scl };
}

const dateOf = (id) => {
  const m = id.match(/_(\d{4})(\d{2})(\d{2})T/);
  return `${m[1]}-${m[2]}-${m[3]}`;
};

/** @returns {{ dataUrl, bounds, lossHa, largestHa, validFrac }} */
export async function computeVegetationLoss({ preId, postId, coord: [lng, lat], delta, signal }) {
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].map((v) => Number(v.toFixed(5)));
  const [preR, postR] = await Promise.all([readScene(preId, bbox, signal), readScene(postId, bbox, signal)]);
  const pixelM2 = ((2 * delta * 111320 * Math.cos((lat * Math.PI) / 180)) / SIZE) * ((2 * delta * 110570) / SIZE);
  const res = vegetationLoss(
    { raster: preR, date: dateOf(preId) },
    { raster: postR, date: dateOf(postId) },
    { width: SIZE, height: SIZE, pixelM2 }
  );
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.getContext('2d').putImageData(new ImageData(res.rgba, SIZE, SIZE), 0, 0);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    bounds: [
      [bbox[1], bbox[0]],
      [bbox[3], bbox[2]],
    ],
    lossHa: res.lossHa,
    largestHa: res.largestHa,
    validFrac: res.validFrac,
  };
}
