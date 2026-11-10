import { useEffect, useRef } from 'react';
import { JABAR } from '../../config/constants';

/**
 * Globe retro bertitik (diadaptasi dari desain Figma "Landing Page Globe Retro"):
 * - bola titik pola Fibonacci yang berputar, orbit mengikuti kursor
 * - lintasan satelit Sentinel-1 (putus-putus) & Sentinel-2 (titik-titik) melintas di atas Jawa Barat,
 *   dengan ikon satelit yang bergerak
 * - titik kejadian longsor (terakota) dan sinyal di Jawa Barat
 * - focus=true → berputar ke Jawa Barat & membesar, lalu memanggil onArrive()
 * Warna tinta/kertas dibaca dari token tema (--ink-rgb, --paper).
 */

const GLOBE_POINTS = Array.from({ length: 950 }, (_, i) => {
  const y = 1 - (i / 949) * 2;
  const r = Math.sqrt(1 - y * y);
  const a = Math.PI * (3 - Math.sqrt(5)) * i;
  return { x: Math.cos(a) * r, y, z: Math.sin(a) * r };
});

const toSphere = (lat, lon) => {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return { x: Math.cos(la) * Math.cos(lo), y: -Math.sin(la), z: Math.cos(la) * Math.sin(lo) };
};

function createArc(from, to, lift, steps = 48) {
  const dot = Math.max(-1, Math.min(1, from.x * to.x + from.y * to.y + from.z * to.z));
  const angle = Math.acos(dot);
  const s = Math.sin(angle);
  return Array.from({ length: steps }, (_, i) => {
    const p = i / (steps - 1);
    if (s < 0.001) return from;
    const a = Math.sin((1 - p) * angle) / s;
    const b = Math.sin(p * angle) / s;
    const l = 1 + Math.sin(p * Math.PI) * lift;
    return { x: (from.x * a + to.x * b) * l, y: (from.y * a + to.y * b) * l, z: (from.z * a + to.z * b) * l };
  });
}

function sampleRoute(route, progress) {
  const sp = progress * (route.length - 1);
  const i = Math.min(route.length - 2, Math.floor(sp));
  const t = sp - i;
  const c = route[i];
  const n = route[i + 1];
  return { x: c.x + (n.x - c.x) * t, y: c.y + (n.y - c.y) * t, z: c.z + (n.z - c.z) * t };
}

const terminalFade = (p) => {
  const e = Math.min(1, p / 0.1, (1 - p) / 0.1);
  return e * e * (3 - 2 * e);
};

const JABAR_POINT = toSphere(JABAR.lat, JABAR.lon);
// Lintasan orbit sinkron-matahari (hampir kutub) yang melintas di atas Jawa Barat
const ORBITS = [
  { name: 'SENTINEL-1', route: createArc(toSphere(62, 121), toSphere(-64, 94), 0.12), dash: [5, 5], width: 0.9, alpha: 0.55, period: 17, offset: 0.1 },
  { name: 'SENTINEL-2', route: createArc(toSphere(64, 96), toSphere(-62, 119), 0.08), dash: [1, 3], width: 1.4, alpha: 0.72, period: 23, offset: 0.55 },
];
const LABELS = [
  { name: 'JAWA BARAT', point: JABAR_POINT, main: true },
  { name: 'JAKARTA', point: toSphere(-6.2, 106.8) },
  { name: 'SUMATRA', point: toSphere(-0.6, 101.3) },
  { name: 'KALIMANTAN', point: toSphere(0.9, 114) },
];

// Rotasi agar titik (lat, lon) tepat di tengah depan globe
const TARGET_Y = Math.atan2(Math.cos((JABAR.lon * Math.PI) / 180), Math.sin((JABAR.lon * Math.PI) / 180));
const TARGET_X = (-JABAR.lat * Math.PI) / 180;
const FOCUS_MS = 1600;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  return {
    ink: cs.getPropertyValue('--ink-rgb').trim() || '21 21 18',
    paper: cs.getPropertyValue('--paper').trim() || '#f4f3ee',
    dot: cs.getPropertyValue('--series-1').trim() || '#c2562d',
  };
}

export default function RetroGlobe({ events = [], theme, focus = false, onArrive }) {
  const canvasRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const colors = useRef(null);
  const focusRef = useRef({ start: null, fromY: 0, fromX: 0, arrived: false });
  const arriveRef = useRef(onArrive);

  useEffect(() => {
    arriveRef.current = onArrive;
  }, [onArrive]);

  // Baca warna satu frame setelah tema berubah: atribut data-theme dipasang oleh efek induk
  // (App/useTheme) yang berjalan SETELAH efek komponen anak ini.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      colors.current = readTheme();
    });
    return () => cancelAnimationFrame(id);
  }, [theme]);

  useEffect(() => {
    if (focus && focusRef.current.start === null) focusRef.current.start = performance.now();
  }, [focus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const eventPoints = events.map((f) => toSphere(f.geometry.coordinates[1], f.geometry.coordinates[0]));
    let raf = 0;
    let size = 0;
    let start = null;
    let px = 0;
    let py = 0;
    let lastY = 0;
    let lastX = 0;

    const resize = () => {
      const b = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = b.width;
      canvas.width = b.width * dpr;
      canvas.height = b.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (ts) => {
      if (start === null) start = ts;
      const { ink, paper, dot } = colors.current ?? readTheme();
      const inkA = (a) => `rgb(${ink} / ${a})`;
      const elapsed = (ts - start) / 1000;
      px += (pointer.current.x - px) * 0.045;
      py += (pointer.current.y - py) * 0.045;
      ctx.clearRect(0, 0, size, size);

      let radius = size * 0.42;
      let rotY = (reduced ? 0.45 : elapsed * 0.126) + px * 0.24;
      let rotX = -0.18 + py * 0.12;

      const f = focusRef.current;
      if (f.start !== null) {
        if (f.fromY === 0 && f.fromX === 0) {
          f.fromY = lastY;
          f.fromX = lastX;
        }
        const t = Math.min(1, (ts - f.start) / (reduced ? 1 : FOCUS_MS));
        const k = ease(t);
        const dY = ((((TARGET_Y - f.fromY) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
        rotY = f.fromY + dY * k;
        rotX = f.fromX + (TARGET_X - f.fromX) * k;
        radius *= 1 + 5.5 * k * k * k; // membesar hingga menutupi layar
        if (t >= 1 && !f.arrived) {
          f.arrived = true;
          arriveRef.current?.();
        }
      }
      lastY = rotY;
      lastX = rotX;

      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);
      const project = (p) => {
        const x1 = p.x * cy - p.z * sy;
        const z1 = p.x * sy + p.z * cy;
        return { x: x1, y: p.y * cx - z1 * sx, z: p.y * sx + z1 * cx };
      };
      const c = size / 2;

      // bola titik
      const projected = GLOBE_POINTS.map(project).sort((a, b) => a.z - b.z);
      for (const p of projected) {
        const depth = (p.z + 1) / 2;
        ctx.beginPath();
        ctx.arc(c + p.x * radius, c + p.y * radius, 0.45 + depth * 1.25, 0, Math.PI * 2);
        ctx.fillStyle = inkA(0.1 + depth * 0.72);
        ctx.fill();
      }

      // lintasan satelit
      for (const o of ORBITS) {
        ctx.save();
        ctx.setLineDash(o.dash);
        ctx.lineWidth = o.width;
        ctx.beginPath();
        let drawing = false;
        for (const p of o.route.map(project)) {
          if (p.z > 0.02) {
            const x = c + p.x * radius;
            const y = c + p.y * radius;
            if (drawing) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
            drawing = true;
          } else drawing = false;
        }
        ctx.strokeStyle = inkA(o.alpha);
        ctx.stroke();
        ctx.restore();
      }

      // kejadian longsor
      for (const e of eventPoints) {
        const p = project(e);
        if (p.z < 0.05) continue;
        ctx.beginPath();
        ctx.arc(c + p.x * radius, c + p.y * radius, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = dot;
        ctx.fill();
      }

      // label tempat
      for (const l of LABELS) {
        const p = project(l.point);
        if (p.z < 0.12) continue;
        const x = c + p.x * radius;
        const y = c + p.y * radius;
        ctx.beginPath();
        ctx.arc(x, y, l.main ? 4 : 3, 0, Math.PI * 2);
        ctx.fillStyle = paper;
        ctx.fill();
        ctx.strokeStyle = inkA(0.9);
        ctx.lineWidth = 1;
        ctx.stroke();
        if (l.main) {
          const pulse = (elapsed % 2.4) / 2.4;
          ctx.beginPath();
          ctx.arc(x, y, 4 + pulse * 14, 0, Math.PI * 2);
          ctx.strokeStyle = inkA(0.45 * (1 - pulse));
          ctx.stroke();
        }
        if ((l.main || p.z > 0.42) && size > 420) {
          ctx.font = `500 ${l.main ? 9 : 8}px "DM Mono", monospace`;
          ctx.fillStyle = inkA(l.main ? 0.95 : 0.7);
          ctx.fillText(l.name, x + 8, y - 8);
        }
      }

      // satelit bergerak di lintasan
      ORBITS.forEach((o, i) => {
        const prog = reduced ? 0.3 + i * 0.25 : (elapsed / o.period + o.offset) % 1;
        const p = project(sampleRoute(o.route, prog));
        const n = project(sampleRoute(o.route, Math.min(1, prog + 0.004)));
        if (p.z < 0.04) return;
        ctx.save();
        ctx.globalAlpha = terminalFade(prog);
        ctx.translate(c + p.x * radius, c + p.y * radius);
        ctx.rotate(Math.atan2(n.y - p.y, n.x - p.x));
        ctx.fillStyle = paper;
        ctx.strokeStyle = inkA(1);
        ctx.lineWidth = 1;
        // badan satelit + dua panel surya
        ctx.fillRect(-3, -3, 6, 6);
        ctx.strokeRect(-3, -3, 6, 6);
        for (const sgn of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(0, sgn * 3);
          ctx.lineTo(0, sgn * 5);
          ctx.stroke();
          ctx.fillRect(-5, sgn * 5 + (sgn < 0 ? -4 : 0), 10, 4);
          ctx.strokeRect(-5, sgn * 5 + (sgn < 0 ? -4 : 0), 10, 4);
        }
        ctx.restore();
      });

      // tepi bola
      ctx.beginPath();
      ctx.arc(c, c, radius, 0, Math.PI * 2);
      ctx.strokeStyle = inkA(0.38);
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    const onPointer = (e) => {
      const b = canvas.getBoundingClientRect();
      pointer.current = { x: (e.clientX - b.left) / b.width - 0.5, y: (e.clientY - b.top) / b.height - 0.5 };
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', onPointer);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onPointer);
    };
  }, [events]);

  return <canvas ref={canvasRef} className="lp-globe-canvas" />;
}
