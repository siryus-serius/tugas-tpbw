import { useEffect, useRef } from 'react';

/** Pemilih tahun langsung di bilah atas: ◀ tahun ▶ */
function YearStepper({ years, year, setYear }) {
  const i = years.indexOf(year);
  return (
    <div className="year-stepper" role="group" aria-label="Tahun">
      <button onClick={() => setYear(years[i - 1])} disabled={i <= 0} aria-label="Tahun sebelumnya">
        ◀
      </button>
      <select value={year ?? ''} onChange={(e) => setYear(Number(e.target.value))} aria-label="Pilih tahun">
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <button onClick={() => setYear(years[i + 1])} disabled={i < 0 || i >= years.length - 1} aria-label="Tahun berikutnya">
        ▶
      </button>
    </div>
  );
}

/**
 * Bilah atas: [☰ Info] judul · ◀ tahun ▶ · menu (Peta & Citra, Analisis, Validasi).
 * Dropdown muncul tepat di bawah tombolnya; klik di luar / Esc menutup.
 * `menus`: [{ key, icon, label, badge?, content }]
 */
export default function TopBar({ panelOpen, onTogglePanel, years, year, setYear, menus, openKey, setOpenKey }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!openKey) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpenKey(null);
    const onKey = (e) => e.key === 'Escape' && setOpenKey(null);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openKey, setOpenKey]);

  return (
    <header className="topbar" ref={ref}>
      <button
        className={`menu-btn ${panelOpen ? 'active' : ''}`}
        onClick={onTogglePanel}
        aria-pressed={panelOpen}
        title={panelOpen ? 'Tutup panel informasi' : 'Buka panel informasi'}
      >
        ☰ <span className="label">Info</span>
      </button>
      <div className="brand">
        <strong>Longsor &amp; Gempa Jawa Barat</strong>
        <span className="muted small">Sentinel-1/2 · InSAR · BMKG</span>
      </div>
      <YearStepper years={years} year={year} setYear={setYear} />
      <nav className="menus">
        {menus.map((m) => (
          <div key={m.key} className="menu">
            <button
              className={`menu-btn ${openKey === m.key ? 'active' : ''}`}
              aria-expanded={openKey === m.key}
              onClick={() => setOpenKey(openKey === m.key ? null : m.key)}
              title={m.label}
            >
              <span aria-hidden="true">{m.icon}</span>
              <span className="label">{m.label}</span>
              {m.badge}
            </button>
            {openKey === m.key && <div className="dropdown">{m.content}</div>}
          </div>
        ))}
      </nav>
    </header>
  );
}
