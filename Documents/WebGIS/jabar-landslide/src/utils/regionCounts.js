// Angka & warna per kabupaten/kota untuk peta yang diperkecil: dari Galura (DPMD) atau kejadian terverifikasi.
import { COUNT_CLASSES } from '../config/constants';
import { countByKabupaten, kabKey } from './kabupaten';
import { isAllYears } from './years';

/** Sumber angka wilayah. */
export const REGION_SOURCES = { galura: 'Galura (DPMD)', terverifikasi: 'Terverifikasi' };

const PALETTE = COUNT_CLASSES.map(({ color, ink }) => ({ color, ink }));

/** Pembulatan "enak dibaca": 1, 2, 5 × 10^n. */
function nice(x) {
  if (x <= 1) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  const m = x / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/**
 * Kelas warna untuk sekumpulan angka. Angka kecil (≤ 6, kejadian terverifikasi) memakai kelas tetap;
 * angka besar (Galura, ratusan–ribuan) memakai batas 10% / 30% / 60% dari maksimum, dibulatkan.
 */
export function classesFor(values) {
  const max = Math.max(0, ...values);
  if (max <= 6) return COUNT_CLASSES;
  const [b1, b2, b3] = [nice(max * 0.1), nice(max * 0.3), nice(max * 0.6)].map((b, i, a) => Math.max(b, (a[i - 1] ?? 0) + 1));
  const fmt = (n) => n.toLocaleString('id-ID');
  return [
    { max: b1, label: `1–${fmt(b1)} kejadian` },
    { max: b2, label: `${fmt(b1 + 1)}–${fmt(b2)} kejadian` },
    { max: b3, label: `${fmt(b2 + 1)}–${fmt(b3)} kejadian` },
    { max: Infinity, label: `> ${fmt(b3)} kejadian` },
  ].map((c, i) => ({ ...c, ...PALETTE[i] }));
}

export const classOf = (n, classes) => classes.find((c) => n <= c.max) ?? classes.at(-1);

/** Tahun Galura yang tercakup periode terpilih ([] bila tahun di luar cakupan dataset). */
export function galuraYears(galura, year) {
  if (!galura) return [];
  const [from, to] = galura.periode;
  if (isAllYears(year)) return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return year >= from && year <= to ? [year] : [];
}

/** Ringkasan Galura untuk satu kabupaten pada tahun-tahun tertentu: jumlah + 5 kecamatan teratas. */
export function galuraKab(k, years) {
  if (!k || !years.length) return null;
  const sum = (t) => years.reduce((s, y) => s + (t[y] ?? 0), 0);
  const kecamatan = Object.values(k.kecamatan)
    .map((c) => ({ nama: c.nama, count: sum(c.tahun) }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  return { count: sum(k.tahun), kecamatanCount: kecamatan.length, top: kecamatan.slice(0, 5) };
}

/**
 * Kelompok per kabupaten untuk periode terpilih.
 * Mengembalikan { groups, classes, source, note } — `source` bisa jatuh ke 'terverifikasi' bila
 * Galura tidak mencakup tahun terpilih (mis. 2025–2026).
 */
export function regionGroups({ events, kabIndex, galura, year, source }) {
  const years = galuraYears(galura, year);
  const useGalura = source === 'galura' && years.length > 0;
  const verified = countByKabupaten(events, kabIndex);
  const byKey = new Map(verified.map((g) => [g.key, g]));

  let groups;
  if (useGalura) {
    groups = Object.entries(galura.kabupaten)
      .map(([key, k]) => {
        const g = galuraKab(k, years);
        const adm = kabIndex.get(key);
        const v = byKey.get(key);
        if (!g?.count || !adm) return null;
        return {
          key,
          name: k.nama,
          count: g.count,
          deaths: v?.deaths ?? 0,
          label: adm.label,
          bounds: adm.bounds,
          events: v?.events ?? [],
          noCoord: v?.noCoord ?? 0,
          galura: g,
        };
      })
      .filter(Boolean);
    // Kab/kota tanpa data Galura (mis. kota) tetap tampil bila ada kejadian terverifikasi — tanpa angka Galura
    for (const v of verified) if (!groups.some((g) => g.key === v.key)) groups.push({ ...v, count: 0, onlyVerified: true });
    groups.sort((a, b) => b.count - a.count);
  } else {
    groups = verified.map((g) => {
      const k = galura?.kabupaten?.[kabKey(g.name)];
      return { ...g, galura: galuraKab(k, years) };
    });
  }

  const note =
    source === 'galura' && !useGalura && galura
      ? `Data Galura hanya ${galura.periode[0]}–${galura.periode[1]}; angka memakai kejadian terverifikasi.`
      : null;
  return {
    groups,
    classes: classesFor(groups.map((g) => g.count)),
    source: useGalura ? 'galura' : 'terverifikasi',
    galuraLabel: years.length ? (years.length > 1 ? `${years[0]}–${years.at(-1)}` : String(years[0])) : null,
    galuraUrl: galura?.sumber?.url ?? null,
    note,
  };
}
