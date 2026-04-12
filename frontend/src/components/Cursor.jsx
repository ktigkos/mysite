import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dotRef   = useRef(null);
  const ringRef  = useRef(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    let rx = 0, ry = 0; // ring lags behind

    const onMove = (e) => {
      const x = e.clientX, y = e.clientY;
      dot.style.transform  = `translate(${x}px,${y}px)`;
      // ring lerps in rAF
      dot._tx = x; dot._ty = y;
    };

    const onDown = () => ring.classList.add('pressed');
    const onUp   = () => ring.classList.remove('pressed');
    const onEnterLink = () => ring.classList.add('hovering');
    const onLeaveLink = () => ring.classList.remove('hovering');

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);

    const links = () => document.querySelectorAll('a,button,[role=button]');
    const attach = () => links().forEach(el => {
      el.addEventListener('mouseenter', onEnterLink);
      el.addEventListener('mouseleave', onLeaveLink);
    });
    attach();
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });

    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (dot._tx == null) return;
      rx += (dot._tx - rx) * 0.1;
      ry += (dot._ty - ry) * 0.1;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
      mo.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cur-dot" />
      <div ref={ringRef} className="cur-ring" />
    </>
  );
}
