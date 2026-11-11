import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

const KEY = 'tema';
const DURATION = 750;

function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // penyimpanan browser tidak tersedia (mode privat) → pakai setelan sistem
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Titik asal animasi: pusat tombol tema yang diklik (atau pojok kanan atas bila tidak ada). */
function originOf(event) {
  const el = event?.target?.closest?.('label, button') ?? event?.currentTarget;
  const r = el?.getBoundingClientRect?.();
  if (r && r.width) return [r.left + r.width / 2, r.top + r.height / 2];
  return [window.innerWidth - 40, 40];
}

/**
 * Tema terang/gelap: disimpan per pengguna, awalnya mengikuti setelan sistem.
 * Pergantian tema dianimasikan halus: tema baru menyebar melingkar dari tombol tema (View
 * Transitions API). Browser tanpa dukungan → transisi warna lembut (kelas .theme-fade).
 * prefers-reduced-motion → langsung berganti tanpa animasi.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // abaikan
    }
  }, [theme]);

  const toggleTheme = (event) => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.dataset.theme = next; // terapkan seketika agar snapshot "sesudah" sudah bertema baru
      flushSync(() => setTheme(next));
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return apply();

    if (!document.startViewTransition) {
      root.classList.add('theme-fade');
      apply();
      window.setTimeout(() => root.classList.remove('theme-fade'), DURATION);
      return undefined;
    }

    const [x, y] = originOf(event);
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = document.startViewTransition(apply);
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: DURATION, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
    return undefined;
  };

  return { theme, toggleTheme };
}
