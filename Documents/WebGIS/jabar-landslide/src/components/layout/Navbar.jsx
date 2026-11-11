import { useState } from 'react';
import GalaxyButton from '../ui/GalaxyButton';
import SkyToggle from '../ui/SkyToggle';
import { ALL_YEARS } from '../../utils/years';

/**
 * Navbar "pill" menempel di atas: nama · menu pill (bagian halaman, aktif mengikuti scroll) · pemilih tahun
 * (`years` berisi tiap tahun + ALL_YEARS = semua tahun digabung).
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
        <GalaxyButton className="brand-btn" onClick={onHome ?? (() => go(sections[0].id))} title="Kembali ke halaman pembuka">
          Longsor Jabar
        </GalaxyButton>

        <nav className="pill-nav" aria-label="Bagian halaman">
          {sections.map((s) => (
            <button key={s.id} className={active === s.id ? 'pill active' : 'pill'} onClick={() => go(s.id)}>
              {s.label}
              {s.id === 'validasi' && validationBadge}
            </button>
          ))}
        </nav>

        <div className="navbar-right">
          <SkyToggle dark={theme === 'dark'} onToggle={onToggleTheme} />
          <div className="year-pill" role="group" aria-label="Tahun">
            <button onClick={() => setYear(years[i - 1])} disabled={i <= 0} aria-label="Tahun sebelumnya">
              ‹
            </button>
            <select value={year ?? ''} onChange={(e) => setYear(e.target.value === ALL_YEARS ? ALL_YEARS : Number(e.target.value))} aria-label="Pilih tahun">
              {years.map((y) => (
                <option key={y} value={y}>
                  {y === ALL_YEARS ? 'Semua tahun' : y}
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
