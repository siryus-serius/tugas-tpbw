/** Encoder PNG RGBA minimal (zlib bawaan Node ≥ 22.2) + pewarnaan Δ kecepatan InSAR. */
import zlib from 'zlib';

export function encodePNG(w, h, rgba) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Divergen: merah = menjauhi satelit (turun), biru = mendekati; transparan bila |Δv| < minDelta. */
function deltaColor(d, minDelta) {
  const a = Math.abs(d);
  if (Number.isNaN(d) || a < minDelta) return null;
  const t = Math.min(1, (a - minDelta) / 45);
  const alpha = Math.round(110 + 145 * t);
  return d < 0
    ? [Math.round(250 - 70 * t), Math.round(170 - 150 * t), Math.round(60 - 40 * t), alpha]
    : [Math.round(90 - 60 * t), Math.round(170 - 90 * t), Math.round(250 - 40 * t), alpha];
}

export function renderDeltaPNG(grid, delta, minDelta) {
  const buf = Buffer.alloc(grid.w * grid.h * 4);
  for (let i = 0; i < delta.length; i++) {
    const c = deltaColor(delta[i], minDelta);
    if (c) buf.set(c, i * 4);
  }
  return encodePNG(grid.w, grid.h, buf);
}
