import { useState } from 'react';
import SparkleToggle from '../ui/SparkleToggle';

/**
 * Navbar "pill" menempel di atas: nama · menu pill (bagian halaman, aktif mengikuti scroll) · pemilih tahun.
 * Di HP: tombol ☰ membuka daftar menu.
 */
export default function Navbar({ sections, active, onNavigate, years, year, setYear, validationBadge, theme, onToggleTheme, onHome }) {
  const [open, setOpen] = useState(false);
  const i = years.indexOf(year);
  const go = (id) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button className="brand-btn" onClick={onHome ?? (() => go(sections[0].id))} title="Kembali ke halaman pembuka">
          Longsor Jabar
        </button>

        <nav className="pill-nav" aria-label="Bagian halaman">
          {sections.map((s) => (
            <button key={s.id} className={active === s.id ? 'pill active' : 'pill'} onClick={() => go(s.id)}>
              {s.label}
              {s.id === 'validasi' && validationBadge}
            </button>
          ))}
        </nav>

        <div className="navbar-right">
          <span className="theme-toggle" title={theme === 'dark' ? 'Mode gelap (klik untuk terang)' : 'Mode terang (klik untuk gelap)'}>
            <SparkleToggle checked={theme === 'dark'} onChange={onToggleTheme} label="Mode gelap" />
          </span>
          <div className="year-pill" role="group" aria-label="Tahun">
            <button onClick={() => setYear(years[i - 1])} disabled={i <= 0} aria-label="Tahun sebelumnya">
              ‹
            </button>
            <select value={year ?? ''} onChange={(e) => setYear(Number(e.target.value))} aria-label="Pilih tahun">
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button onClick={() => setYear(years[i + 1])} disabled={i < 0 || i >= years.length - 1} aria-label="Tahun berikutnya">
              ›
            </button>
          </div>
          <button className="menu-toggle" onClick={() => setOpen((o) => !o)} aria-label="Buka menu" aria-expanded={open}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="mobile-nav" aria-label="Bagian halaman">
          {sections.map((s) => (
            <button key={s.id} className={active === s.id ? 'active' : ''} onClick={() => go(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
