import { useEffect, useState } from 'react';
import { isAllYears } from '../utils/years';

export const STEP_MS = 1800;

/**
 * Pemutar linimasa: memajukan tahun terpilih setiap STEP_MS sampai tahun terakhir lalu berhenti.
 * Menekan play saat berada di tahun terakhir / "semua tahun" → mulai lagi dari tahun pertama.
 */
export default function useTimelinePlayer(years, year, setYear) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    const t = window.setTimeout(() => {
      const i = years.indexOf(year);
      if (i < 0 || i >= years.length - 1) setPlaying(false);
      else setYear(years[i + 1]);
    }, STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, year, years, setYear]);

  // Sampai di tahun terakhir → berhenti setelah tahun itu sempat tampil
  const atEnd = years.indexOf(year) === years.length - 1;

  const toggle = () => {
    if (playing) return setPlaying(false);
    if (isAllYears(year) || atEnd || !years.includes(year)) setYear(years[0]);
    setPlaying(true);
    return undefined;
  };

  return { playing, toggle, stop: () => setPlaying(false) };
}
