import { useEffect, useRef, useState } from 'react';

const WORDS = ['pantau.', 'petakan.', 'ukur.', 'pahami.', 'prediksi.', 'waspadai.', 'selamatkan.'];

/**
 * Kalimat besar dengan kata yang berganti saat digulir: "Lereng bisa kita {pantau. petakan. …}".
 * Awalan menempel di tengah layar; kata yang sedang melintasi garis tengah menyala (aksen),
 * kata lain meredup. Kata aktif = kata yang pusatnya paling dekat dengan "slot" kata: di samping
 * awalan (desktop, tata letak baris) atau tepat di bawahnya (HP, tata letak kolom). Dihitung per
 * frame saat digulir; tetap akurat dengan scroll halus Lenis, jalan di semua browser.
 */
export default function ScrollWords() {
  const list = useRef(null);
  const lead = useRef(null);
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false); // sudah lewat kata terakhir → seluruh kalimat disembunyikan
  // Desktop: saat kata terakhir aktif, awalan bergeser ke tepat di atas kata itu (tersusun 2 baris)
  const [shift, setShift] = useState({ x: 0, y: 0 });
  const shiftRef = useRef(shift);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const items = [...(list.current?.children ?? [])];
      const raw = lead.current?.getBoundingClientRect();
      if (!items.length || !raw) return;
      // Posisi awalan TANPA pergeseran susun (agar perhitungan tidak terpengaruh animasinya)
      const s = shiftRef.current;
      const ref = { top: raw.top - s.y, left: raw.left - s.x, height: raw.height };
      // HP: awalan di atas daftar (kolom) → slot kata tepat di bawah awalan
      const column = getComputedStyle(lead.current.parentElement).flexDirection === 'column';
      const lineH = items[0].getBoundingClientRect().height;
      const y = column ? ref.top + ref.height + lineH / 2 : ref.top + ref.height / 2;
      let best = 0;
      let bestD = Infinity;
      items.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - y);
        if (d < bestD) [best, bestD] = [i, d];
      });
      setActive(best);
      const last = best === items.length - 1;
      const next = !column && last ? { x: Math.round(list.current.getBoundingClientRect().left - ref.left), y: -Math.round(lineH) } : { x: 0, y: 0 };
      if (next.x !== s.x || next.y !== s.y) {
        shiftRef.current = next;
        setShift(next);
      }
      // Sudah paling bawah: awalan tidak lagi menempel & mulai ikut tergulir → sembunyikan seluruh kalimat
      const stickyTop = parseFloat(getComputedStyle(lead.current).top) || 0;
      setDone(last && ref.top < stickyTop - lineH * 0.6); // beri jeda ±½ baris
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section className="lp-words" aria-label="Lereng bisa kita pantau, petakan, ukur, pahami, prediksi, waspadai, dan selamatkan.">
      <div className={`lp-words-inner${done ? ' is-done' : ''}${shift.y ? ' is-stacked' : ''}`} aria-hidden="true">
        <h2 ref={lead} className="lp-words-lead" style={{ transform: `translate(${shift.x}px, ${shift.y}px)` }}>Lereng bisa kita</h2>
        <ul ref={list} className="lp-words-list">
          {WORDS.map((w, i) => (
            <li key={w} data-i={i} className={i === active ? 'is-active' : i < active ? 'is-past' : undefined}>
              {w}
            </li>
          ))}
        </ul>
      </div>
      <p className="lp-words-outro">
        dan kami tunjukkan caranya — <span>dari satelit, sensor gempa, hingga laporan lapangan.</span>
      </p>
    </section>
  );
}
