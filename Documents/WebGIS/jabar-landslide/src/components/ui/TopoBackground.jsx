import { useEffect, useRef } from 'react';

/*
 * Latar ambient garis kontur topografi untuk seluruh web.
 * Medan ketinggian buatan (jumlah gelombang sinus + beberapa "bukit" Gauss) → marching squares →
 * garis kontur digambar SEKALI ke <canvas> (ringan, bukan ribuan elemen SVG). Kontur indeks
 * (tiap ke-5) sedikit lebih tebal seperti peta topografi. Warna dari token tema --ink-rgb dan
 * digambar ulang saat tema/ukuran layar berubah. Gerak drift pelan via CSS (topo-bg di base.css).
 */

const LEVELS = 22;
const CELL = 9; // px per sel grid (CSS px)

// Bukit/lembah tetap agar pola stabil antar-muat
const HILLS = [
  [0.22, 0.3, 0.16, 1.1],
  [0.7, 0.62, 0.2, 1.3],
  [0.48, 0.85, 0.12, -0.8],
  [0.9, 0.18, 0.14, 0.9],
  [0.1, 0.78, 0.18, 0.7],
];

function height(u, v) {
  let h =
    0.35 * Math.sin(u * 5.1 + Math.cos(v * 3.3) * 1.4) +
    0.28 * Math.cos(v * 4.4 - Math.sin(u * 2.7) * 1.2) +
    0.12 * Math.sin((u + v) * 9.5);
  for (const [cx, cy, r, a] of HILLS) {
    const d2 = (u - cx) ** 2 + (v - cy) ** 2;
    h += a * Math.exp(-d2 / (2 * r * r));
  }
  return h;
}

// Tabel marching squares: indeks kasus → pasangan tepi (0 atas, 1 kanan, 2 bawah, 3 kiri)
const CASES = {
  1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]], 5: [[3, 0], [2, 1]], 6: [[0, 2]], 7: [[3, 0]],
  8: [[3, 0]], 9: [[0, 2]], 10: [[0, 1], [3, 2]], 11: [[0, 1]], 12: [[3, 1]], 13: [[2, 1]], 14: [[3, 2]],
};

function draw(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const nx = Math.ceil(w / CELL) + 1;
  const ny = Math.ceil(h / CELL) + 1;
  const scale = Math.max(w, h);
  const f = new Float32Array(nx * ny);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const v = height((i * CELL) / scale, (j * CELL) / scale);
      f[j * nx + i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink-rgb').trim() || '21 21 18';
  const rgb = ink.split(/\s+/).join(',');

  for (let k = 1; k < LEVELS; k++) {
    const t = min + ((max - min) * k) / LEVELS;
    const major = k % 5 === 0;
    ctx.beginPath();
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = f[j * nx + i];
        const b = f[j * nx + i + 1];
        const c = f[(j + 1) * nx + i + 1];
        const d = f[(j + 1) * nx + i];
        const idx = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
        const segs = CASES[idx];
        if (!segs) continue;
        const x = i * CELL;
        const y = j * CELL;
        const lerp = (p, q) => (t - p) / (q - p);
        const edge = (e) =>
          e === 0
            ? [x + CELL * lerp(a, b), y]
            : e === 1
              ? [x + CELL, y + CELL * lerp(b, c)]
              : e === 2
                ? [x + CELL * lerp(d, c), y + CELL]
                : [x, y + CELL * lerp(a, d)];
        for (const [e1, e2] of segs) {
          const [x1, y1] = edge(e1);
          const [x2, y2] = edge(e2);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
      }
    }
    ctx.strokeStyle = `rgba(${rgb},${major ? 0.13 : 0.065})`;
    ctx.lineWidth = major ? 1.1 : 0.7;
    ctx.stroke();
  }
}

export default function TopoBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    let raf = 0;
    const redraw = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => draw(canvas));
    };
    redraw();
    const ro = new ResizeObserver(redraw);
    ro.observe(canvas);
    // Tema berganti (atribut data-theme pada <html>) → warna garis ikut berganti
    const mo = new MutationObserver(redraw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="topo-bg" aria-hidden="true" />;
}
