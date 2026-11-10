import { useEffect, useRef } from 'react';

/**
 * Bilah menu atas (gaya geoportal): tombol buka/tutup panel info + menu dropdown.
 * `menus`: [{ key, label, badge?, content }]
 */
export default function TopBar({ panelOpen, onTogglePanel, menus, openKey, setOpenKey }) {
  const ref = useRef(null);

  // Tutup dropdown bila klik di luar bilah menu atau tekan Escape
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
        className={`icon-btn ${panelOpen ? 'active' : ''}`}
        onClick={onTogglePanel}
        aria-label={panelOpen ? 'Tutup panel informasi' : 'Buka panel informasi'}
        aria-pressed={panelOpen}
      >
        ☰
      </button>
      <div className="brand">
        <strong>Longsor &amp; Gempa Jawa Barat</strong>
        <span className="muted small">Sentinel-1/2 · InSAR · BMKG</span>
      </div>
      <nav className="menus">
        {menus.map((m) => (
          <div key={m.key} className="menu">
            <button
              className={`menu-btn ${openKey === m.key ? 'active' : ''}`}
              aria-expanded={openKey === m.key}
              onClick={() => setOpenKey(openKey === m.key ? null : m.key)}
            >
              {m.label}
              {m.badge}
              <span className="caret">▾</span>
            </button>
            {openKey === m.key && <div className="dropdown">{m.content}</div>}
          </div>
        ))}
      </nav>
    </header>
  );
}
