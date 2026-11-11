// Pemilih tahun: angka tahun atau ALL_YEARS (seluruh periode digabung).

export const ALL_YEARS = 'all';

export const isAllYears = (year) => year === ALL_YEARS;

/** Apakah data bertahun `tahun` termasuk periode terpilih. */
export const inYear = (tahun, year) => isAllYears(year) || tahun === year;

/** Label periode untuk judul/kartu, mis. "2025" atau "2021–2026". */
export function yearLabel(year, years = []) {
  if (!isAllYears(year)) return year == null ? '–' : String(year);
  return years.length ? `${years[0]}–${years.at(-1)}` : 'semua tahun';
}
