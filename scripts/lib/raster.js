/** Operasi raster InSAR murni (tanpa I/O): grid, multilook, high-pass, lereng, anomali, klaster. */
import { INSAR, JABAR_BBOX } from '../config.js';

const RAD2MM = -INSAR.wavelengthMm / (4 * Math.PI); // konvensi LiCSBAS: negatif = menjauhi satelit
const CC_MIN = INSAR.coherenceMin * 255;
const ML = INSAR.multilook;

/** Grid hasil (multilook) = irisan frame ∩ bbox Jabar, mengikuti grid unw. */
export function makeGrid(t) {
  const x0 = Math.max(0, Math.floor((JABAR_BBOX[0] - t.ox) / t.rx));
  const x1 = Math.min(t.w, Math.ceil((JABAR_BBOX[2] - t.ox) / t.rx));
  const y0 = Math.max(0, Math.floor((JABAR_BBOX[3] - t.oy) / t.ry));
  const y1 = Math.min(t.h, Math.ceil((JABAR_BBOX[1] - t.oy) / t.ry));
  return {
    w: Math.floor((x1 - x0) / ML),
    h: Math.floor((y1 - y0) / ML),
    x0,
    y0,
    lon0: t.ox + x0 * t.rx, // tepi barat
    lat0: t.oy + y0 * t.ry, // tepi utara
    dlon: t.rx * ML,
    dlat: t.ry * ML, // negatif
  };
}

export const cellCenter = (grid, i) => [
  grid.lon0 + ((i % grid.w) + 0.5) * grid.dlon,
  grid.lat0 + (((i / grid.w) | 0) + 0.5) * grid.dlat,
];

export const overlayBounds = (grid) => [
  [grid.lat0 + grid.dlat * grid.h, grid.lon0],
  [grid.lat0, grid.lon0 + grid.dlon * grid.w],
];

/** High-pass spasial: v − rata-rata lokal (integral image, O(n)). NaN diabaikan. */
export function highpass(v, w, h, r) {
  const W = w + 1;
  const S = new Float64Array(W * (h + 1));
  const C = new Float64Array(W * (h + 1));
  for (let y = 0; y < h; y++) {
    let rs = 0;
    let rc = 0;
    for (let x = 0; x < w; x++) {
      const val = v[y * w + x];
      if (!Number.isNaN(val)) {
        rs += val;
        rc++;
      }
      S[(y + 1) * W + x + 1] = S[y * W + x + 1] + rs;
      C[(y + 1) * W + x + 1] = C[y * W + x + 1] + rc;
    }
  }
  const box = (A, x0, y0, x1, y1) => A[y1 * W + x1] - A[y0 * W + x1] - A[y1 * W + x0] + A[y0 * W + x0];
  const out = new Float32Array(w * h).fill(NaN);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (Number.isNaN(v[i])) continue;
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w, x + r + 1);
      const n = box(C, x0, y0, x1, y1);
      if (n >= 20) out[i] = v[i] - box(S, x0, y0, x1, y1) / n;
    }
  }
  return out;
}

/** Interferogram (unw + koherensi) → pergeseran LOS (mm) pada grid multilook, setelah high-pass. */
export function pairDisplacement(unw, cc, grid) {
  const ccDx = Math.round((unw.ox - cc.ox) / cc.rx); // grid cc bisa bergeser 1 piksel
  const ccDy = Math.round((unw.oy - cc.oy) / cc.ry);
  const out = new Float32Array(grid.w * grid.h).fill(NaN);
  let valid = 0;
  for (let gy = 0; gy < grid.h; gy++) {
    for (let gx = 0; gx < grid.w; gx++) {
      let sum = 0;
      let n = 0;
      for (let dy = 0; dy < ML; dy++) {
        const y = grid.y0 + gy * ML + dy;
        for (let dx = 0; dx < ML; dx++) {
          const x = grid.x0 + gx * ML + dx;
          const v = unw.data[y * unw.w + x];
          const yc = y + ccDy;
          const xc = x + ccDx;
          const c = yc >= 0 && yc < cc.h && xc >= 0 && xc < cc.w ? cc.data[yc * cc.w + xc] : 0;
          if (v !== 0 && !Number.isNaN(v) && c >= CC_MIN) {
            sum += v;
            n++;
          }
        }
      }
      if (n >= 2) {
        out[gy * grid.w + gx] = (sum / n) * RAD2MM;
        valid++;
      }
    }
  }
  if (valid < 700) return null; // interferogram hampir kosong
  const hp = highpass(out, grid.w, grid.h, INSAR.highpassRadius);
  for (let i = 0; i < hp.length; i++) if (Math.abs(hp[i]) > INSAR.maxStepMm) hp[i] = NaN;
  return hp;
}

/**
 * Kemiringan (°) dan aspek (arah lereng turun, ° dari utara searah jarum jam) pada grid multilook.
 */
export function terrainFromDem(dem, grid) {
  const z = new Float32Array(grid.w * grid.h).fill(NaN);
  for (let i = 0; i < z.length; i++) {
    const [lng, lat] = cellCenter(grid, i);
    const x = Math.round((lng - dem.ox) / dem.rx);
    const y = Math.round((lat - dem.oy) / dem.ry);
    if (x >= 0 && y >= 0 && x < dem.w && y < dem.h) z[i] = dem.data[y * dem.w + x];
  }
  const lat = grid.lat0 + (grid.h / 2) * grid.dlat;
  const mx = Math.abs(grid.dlon) * 111320 * Math.cos((lat * Math.PI) / 180);
  const my = Math.abs(grid.dlat) * 110570;
  const slope = new Float32Array(grid.w * grid.h).fill(NaN);
  const aspect = new Float32Array(grid.w * grid.h).fill(NaN);
  for (let y = 1; y < grid.h - 1; y++) {
    for (let x = 1; x < grid.w - 1; x++) {
      const i = y * grid.w + x;
      const dzE = (z[i + 1] - z[i - 1]) / (2 * mx);
      const dzN = (z[i - grid.w] - z[i + grid.w]) / (2 * my); // baris bertambah ke selatan
      slope[i] = (Math.atan(Math.hypot(dzE, dzN)) * 180) / Math.PI;
      aspect[i] = ((Math.atan2(-dzE, -dzN) * 180) / Math.PI + 360) % 360; // arah gradien turun
    }
  }
  return { slope, aspect };
}

/** Δv = v(target) − rata-rata baseline; z = Δv / max(σ, sdFloor). */
export function anomalyGrid(target, baseline) {
  const n = target.length;
  const delta = new Float32Array(n).fill(NaN);
  const z = new Float32Array(n).fill(NaN);
  const base = new Float32Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (Number.isNaN(target[i])) continue;
    let s = 0;
    let s2 = 0;
    let k = 0;
    for (const b of baseline) {
      const x = b[i];
      if (!Number.isNaN(x)) {
        s += x;
        s2 += x * x;
        k++;
      }
    }
    if (k < 2) continue;
    const mean = s / k;
    const sd = Math.max(INSAR.sdFloor, Math.sqrt(Math.max(0, (s2 - k * mean * mean) / (k - 1))));
    delta[i] = target[i] - mean;
    z[i] = delta[i] / sd;
    base[i] = mean;
  }
  return { delta, z, base };
}

/** Klaster piksel anomali bertanda sama (8-tetangga) di lereng; ambang spasial robust (MAD). */
export function anomalyClusters(grid, delta, z, slope) {
  const { w, h } = grid;
  const smp = [];
  for (let i = 0; i < delta.length; i += 5) if (!Number.isNaN(delta[i])) smp.push(delta[i]);
  smp.sort((a, b) => a - b);
  const med = smp[smp.length >> 1] ?? 0;
  const dev = smp.map((x) => Math.abs(x - med)).sort((a, b) => a - b);
  const thr = Math.max(INSAR.minDelta, INSAR.madK * 1.4826 * (dev[dev.length >> 1] ?? 0));
  const onSlope = (i) => !slope || slope[i] >= INSAR.slopeLandslideDeg;
  const isAnom = (i) => onSlope(i) && Math.abs(delta[i] - med) >= thr && Math.abs(z[i]) >= INSAR.zMin;

  const seen = new Uint8Array(w * h);
  const out = [];
  for (let i0 = 0; i0 < w * h; i0++) {
    if (seen[i0] || !isAnom(i0)) continue;
    const sign = Math.sign(delta[i0]);
    const stack = [i0];
    const px = [];
    seen[i0] = 1;
    while (stack.length) {
      const i = stack.pop();
      px.push(i);
      const x = i % w;
      const y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const j = yy * w + xx;
          if (!seen[j] && isAnom(j) && Math.sign(delta[j]) === sign) {
            seen[j] = 1;
            stack.push(j);
          }
        }
      }
    }
    if (px.length >= INSAR.minPixels) out.push(px);
  }
  return out;
}
