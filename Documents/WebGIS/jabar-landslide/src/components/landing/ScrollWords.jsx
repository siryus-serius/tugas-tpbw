import { useEffect, useRef, useState } from 'react';

const WORDS = ['pantau.', 'petakan.', 'ukur.', 'pahami.', 'prediksi.', 'waspadai.', 'selamatkan.'];

/**
 * Kalimat besar dengan kata yang berganti saat digulir: "Lereng bisa kita {pantau. petakan. …}".
 * Awalan menempel di tengah layar; kata yang sedang melintasi garis tengah menyala (aksen),
 * kata lain meredup. Kata aktif = kata yang pusatnya paling dekat dengan garis awalan (dihitung
 * per frame saat digulir; tetap akurat dengan scroll halus Lenis, jalan di semua browser).
 */
export default function ScrollWords() {
  const list = useRef(null);
  const lead = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const items = [...(list.current?.children ?? [])];
      const ref = lead.current?.getBoundingClientRect();
      if (!items.length || !ref) return;
      const y = ref.top + ref.height / 2;
      let best = 0;
      let bestD = Infinity;
      items.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - y);
        if (d < bestD) [best, bestD] = [i, d];
      });
      setActive(best);
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
        <h2 ref={lead} className="lp-words-lead">Lereng bisa kita&nbsp;</h2>
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
