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
  const [done, setDone] = useState(false); // awalan sudah lepas dari posisi menempel (paling bawah)

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const items = [...(list.current?.children ?? [])];
      const ref = lead.current?.getBoundingClientRect();
      if (!items.length || !ref) return;
      // HP: awalan di atas daftar (kolom) → slot kata tepat di bawah awalan
      const column = getComputedStyle(lead.current.parentElement).flexDirection === 'column';
      const lineH = items[0].getBoundingClientRect().height;
      const y = column ? ref.bottom + lineH / 2 : ref.top + ref.height / 2;
      let best = 0;
      let bestD = Infinity;
      items.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - y);
        if (d < bestD) [best, bestD] = [i, d];
      });
      setActive(best);
      // Sudah paling bawah: awalan tidak lagi menempel & mulai ikut tergulir ke atas → sembunyikan
      const stickyTop = parseFloat(getComputedStyle(lead.current).top) || 0;
      setDone(best === items.length - 1 && ref.top < stickyTop - lineH * 0.6); // beri jeda ±½ baris
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
      <div className="lp-words-inner" aria-hidden="true">
        <h2 ref={lead} className={`lp-words-lead${done ? ' is-done' : ''}`}>Lereng bisa kita</h2>
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
