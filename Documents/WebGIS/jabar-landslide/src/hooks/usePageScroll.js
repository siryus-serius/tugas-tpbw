import { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';

/** Elemen yang punya scroll/zoom sendiri → Lenis tidak ikut campur. */
const PREVENT = '.leaflet-container, .dropdown, .popover, .modal, .table-wrap, .popup-body';

/**
 * Scroll halaman halus (Lenis) + scrollspy bagian aktif.
 * @param sectionIds urutan id <section> yang dipantau navbar
 */
export default function usePageScroll(sectionIds) {
  const lenisRef = useRef(null);
  const [active, setActive] = useState(sectionIds[0]);

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, prevent: (node) => Boolean(node.closest?.(PREVENT)) });
    lenisRef.current = lenis;
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sectionIds]);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -84 });
    else el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return { active, scrollTo };
}
