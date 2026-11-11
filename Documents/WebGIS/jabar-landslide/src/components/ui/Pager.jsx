import { useState } from 'react';

/**
 * Paginasi daftar sederhana: `usePager(items, size)` → { pageItems, pager }.
 * `pager` adalah tombol ‹ Sebelumnya · x–y dari n · Berikutnya ›; tidak tampil bila cukup satu halaman.
 * Halaman otomatis dibatasi bila daftar menyusut (mis. ganti tahun).
 */
export function usePager(items, size = 6) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages - 1);
  const start = current * size;
  const pageItems = items.slice(start, start + size);

  const pager =
    pages > 1 ? (
      <nav className="pager" aria-label="Halaman daftar">
        <button onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Halaman sebelumnya">
          ‹ Sebelumnya
        </button>
        <span className="muted small">
          {start + 1}–{start + pageItems.length} dari {items.length}
        </span>
        <button onClick={() => setPage(current + 1)} disabled={current >= pages - 1} aria-label="Halaman berikutnya">
          Berikutnya ›
        </button>
      </nav>
    ) : null;

  return { pageItems, pager };
}
