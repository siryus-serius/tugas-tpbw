import { useEffect, useRef, useState } from 'react';

/**
 * Toolbar mengambang di atas peta: tombol-tombol yang membuka popover (Lapisan & Citra, Analisis, Legenda).
 * `items`: [{ key, label, content }]
 */
export default function MapToolbar({ items }) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(null);
    const onKey = (e) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="map-toolbar" ref={ref}>
      <div className="toolbar-pills">
        {items.map((it) => (
          <button
            key={it.key}
            className={open === it.key ? 'pill active' : 'pill'}
            aria-expanded={open === it.key}
            onClick={() => setOpen(open === it.key ? null : it.key)}
          >
            {it.label}
          </button>
        ))}
      </div>
      {open && <div className="popover">{items.find((it) => it.key === open)?.content}</div>}
    </div>
  );
}
