import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    let rx = 0, ry = 0;      // ring lags behind dot
    let tx = 0, ty = 0;      // target cursor position
    let hasMoved = false;

    const onMove = (e) => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate3d(${tx}px,${ty}px,0)`;
      hasMoved = true;
    };

    const onDown = () => ring.classList.add('pressed');
    const onUp   = () => ring.classList.remove('pressed');

    // Delegated hover detection: one listener on document instead of
    // N per link/button + a MutationObserver. This replaces the old
    // approach, which leaked listeners on every DOM change.
    const HOVER_SEL = 'a,button,[role=button]';
    const onOver = (e) => {
      if (e.target.closest && e.target.closest(HOVER_SEL)) {
        ring.classList.add('hovering');
      }
    };
    const onOut = (e) => {
      const to = e.relatedTarget;
      if (!to || !to.closest || !to.closest(HOVER_SEL)) {
        ring.classList.remove('hovering');
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup',   onUp,   { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseout',  onOut,  { passive: true });

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!hasMoved) return;
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cur-dot" />
      <div ref={ringRef} className="cur-ring" />
    </>
  );
}
