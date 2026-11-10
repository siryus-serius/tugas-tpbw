import { useEffect } from 'react';
import Lenis from 'lenis';

/** Scroll halus (Lenis) hanya di dalam elemen panel, tidak mengganggu zoom/geser peta. */
export default function useLenisScroll(wrapperRef, enabled = true) {
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!enabled || !wrapper) return undefined;
    const lenis = new Lenis({ wrapper, content: wrapper.firstElementChild, autoRaf: true, smoothWheel: true });
    return () => lenis.destroy();
  }, [wrapperRef, enabled]);
}
