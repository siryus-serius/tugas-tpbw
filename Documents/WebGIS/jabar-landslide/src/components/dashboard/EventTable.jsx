import { useState } from 'react';
import { dateId, shortKab } from '../../utils/format';
import { formatFS } from '../../utils/factorOfSafety';

const COLS = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'lokasi', label: 'Lokasi' },
  { key: 'korban_meninggal', label: 'Korban' },
  { key: 'keterangan', label: 'Keterangan', sortable: false },
  { key: 'fk', label: 'FK' },
  { key: 'risk', label: 'Kerawanan' },
  { key: 'sumber', label: 'Sumber', sortable: false },
];

/** Tabel lengkap kejadian longsor: cari, filter tahun/kabupaten, urutkan, dan buka di peta. */
export default function EventTable({ events, stability, risk, onSelect }) {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('all');
  const [kab, setKab] = useState('all');
  const [sort, setSort] = useState({ key: 'tanggal', dir: -1 });

  const years = [...new Set(events.map((f) => f.properties.tahun))].sort();
  const kabs = [...new Set(events.map((f) => f.properties.kabupaten))].sort();

  const q = query.trim().toLowerCase();
  const val = (f, key) => {
    const p = f.properties;
    if (key === 'lokasi') return `${p.kabupaten} ${p.kecamatan}`;
    if (key === 'fk') return stability.get(f.id)?.fs ?? 99;
    if (key === 'risk') return risk.get(f.id)?.index ?? -1;
    return p[key];
  };
  const rows = events
    .filter((f) => {
      const p = f.properties;
      if (year !== 'all' && p.tahun !== Number(year)) return false;
      if (kab !== 'all' && p.kabupaten !== kab) return false;
      return !q || [p.kabupaten, p.kecamatan, p.desa, p.keterangan, p.sumber].join(' ').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const x = val(a, sort.key);
      const y = val(b, sort.key);
      return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
    });

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : -1 }));
  const deaths = rows.reduce((s, f) => s + (f.properties.korban_meninggal ?? 0), 0);

  return (
    <>
      <div className="section-head">
        <h2>Daftar kejadian</h2>
        <p className="muted">
          Setiap kejadian minimal 2 sumber dan diperiksa otomatis setiap bulan. Klik baris untuk membukanya di peta; kejadian tanpa koordinat hanya dihitung di tingkat kabupaten/kota.
        </p>
      </div>

      <div className="table-filters">
        <input
          type="search"
          placeholder="Cari desa, kecamatan, kabupaten, keterangan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Filter tahun">
          <option value="all">Semua tahun</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select value={kab} onChange={(e) => setKab(e.target.value)} aria-label="Filter kabupaten">
          <option value="all">Semua kabupaten/kota</option>
          {kabs.map((k) => (
            <option key={k} value={k}>
              {shortKab(k)}
            </option>
          ))}
        </select>
        <span className="muted small">
          {rows.length} kejadian · {deaths} korban meninggal
        </span>
      </div>

      <div className="table-wrap">
        <table className="event-table">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key}>
                  {c.sortable === false ? (
                    c.label
                  ) : (
                    <button onClick={() => toggleSort(c.key)}>
                      {c.label}
                      {sort.key === c.key ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const p = f.properties;
              const st = stability.get(f.id);
              const r = risk.get(f.id);
              const onMap = Boolean(f.geometry?.coordinates);
              const open = () => onMap && onSelect({ type: 'event', feature: f });
              return (
                <tr
                  key={f.id}
                  className={onMap ? undefined : 'no-coord'}
                  onClick={open}
                  tabIndex={onMap ? 0 : undefined}
                  onKeyDown={(e) => e.key === 'Enter' && open()}
                  title={onMap ? undefined : 'Kejadian tanpa koordinat — hanya tercatat di tingkat kabupaten/kota'}
                >
                  <td className="nowrap">{dateId(p.tanggal, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <strong>{p.kecamatan}</strong>
                    <span className="muted small">
                      {' '}
                      · {p.desa !== '-' ? `${p.desa}, ` : ''}
                      {shortKab(p.kabupaten)}
                    </span>
                    {!onMap && <span className="tag no-coord-tag">tanpa koordinat</span>}
                  </td>
                  <td className="num">{p.korban_meninggal}</td>
                  <td className="desc">{p.keterangan}</td>
                  <td className="nowrap">
                    {st?.cls ? (
                      <span className="tag" style={{ '--c': st.cls.color }}>
                        {formatFS(st.fs)} {st.cls.label}
                      </span>
                    ) : (
                      '–'
                    )}
                  </td>
                  <td className="nowrap">
                    {r?.cls ? (
                      <span className="tag" style={{ '--c': r.cls.color }}>
                        {r.cls.label}
                      </span>
                    ) : (
                      '–'
                    )}
                  </td>
                  <td className="nowrap" onClick={(e) => e.stopPropagation()}>
                    {p.tautan_sumber?.map((u, i) => (
                      <a key={u} href={u} target="_blank" rel="noreferrer" title={u}>
                        [{i + 1}]
                      </a>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
