import { useState } from 'react';
import CompareViewer from '../compare/CompareViewer';

/** Tombol utama di popup: buka penampil perbandingan dengan citra resolusi tinggi (Esri Wayback). */
export default function CompareButton({ title, coord, compare, movement }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="primary-btn" onClick={() => setOpen(true)}>
        🔍 Bandingkan citra sebelum/sesudah (resolusi tinggi)
      </button>
      {open && (
        <CompareViewer
          title={title}
          coord={coord}
          scenes={compare.scenes}
          period={compare.period}
          movement={movement}
          initialSource="wayback"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
