/**
 * Deteksi kehilangan vegetasi (indikasi bekas longsor) dari dua scene Sentinel-2 L2A:
 *
 *   NDVI = (B08 − B04) / (B08 + B04), reflektansi dikoreksi offset −1000 untuk processing baseline ≥ 04.00
 *   piksel "kehilangan vegetasi" bila: NDVI_sebelum ≥ 0,5 (bervegetasi), NDVI_sesudah ≤ NDVI_sebelum − 0,25,
 *   dan NDVI_sesudah < 0,4; piksel awan/bayangan/no-data (SCL 0,1,3,8,9,10) di salah satu scene dibuang.
 *   Mirip pendekatan rdNDVI HazMapper (Scheip & Wegmann, 2021), dengan ambang tetap.
 *
 * Masukan raster: { b04, b08, scl, width, height } pada grid yang SAMA (crop bbox identik).
 */
export const LOSS = { minPreNdvi: 0.5, minDrop: 0.25, maxPostNdvi: 0.4 };
const INVALID_SCL = new Set([0, 1, 3, 8, 9, 10]);
const BASELINE_04 = '2022-01-25'; // mulai tanggal ini L2A memakai BOA_ADD_OFFSET = −1000

function ndvi(r, scene) {
  const off = scene.date >= BASELINE_04 ? 1000 : 0;
  const out = new Float32Array(r.b04.length).fill(NaN);
  for (let i = 0; i < out.length; i++) {
    if (INVALID_SCL.has(r.scl[i])) continue;
    const red = r.b04[i] - off;
    const nir = r.b08[i] - off;
    if (red + nir > 0) out[i] = (nir - red) / (nir + red);
  }
  return out;
}

/** Klaster 8-tetangga terbesar (jumlah piksel). */
function largestCluster(mask, w, h) {
  const seen = new Uint8Array(mask.length);
  let best = 0;
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || seen[s]) continue;
    let n = 0;
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const i = stack.pop();
      n++;
      const x = i % w;
      const y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          const j = yy * w + xx;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && mask[j] && !seen[j]) {
            seen[j] = 1;
            stack.push(j);
          }
        }
      }
    }
    best = Math.max(best, n);
  }
  return best;
}

/**
 * @returns {{ rgba: Uint8ClampedArray, lossHa, largestHa, validFrac }}
 * pixelM2: luas satu piksel (m²) untuk konversi ke hektar.
 */
export function vegetationLoss(pre, post, { width, height, pixelM2 }) {
  const a = ndvi(pre.raster, pre);
  const b = ndvi(post.raster, post);
  const mask = new Uint8Array(a.length);
  const rgba = new Uint8ClampedArray(a.length * 4);
  let valid = 0;
  let loss = 0;
  for (let i = 0; i < a.length; i++) {
    if (Number.isNaN(a[i]) || Number.isNaN(b[i])) continue;
    valid++;
    if (a[i] >= LOSS.minPreNdvi && b[i] <= a[i] - LOSS.minDrop && b[i] < LOSS.maxPostNdvi) {
      mask[i] = 1;
      loss++;
      const k = i * 4;
      rgba[k] = 255;
      rgba[k + 1] = 30;
      rgba[k + 2] = 30;
      rgba[k + 3] = 200;
    }
  }
  const ha = (n) => Math.round(((n * pixelM2) / 10000) * 10) / 10;
  return { rgba, lossHa: ha(loss), largestHa: ha(largestCluster(mask, width, height)), validFrac: valid / a.length };
}
