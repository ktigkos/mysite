import { useEffect, useRef } from 'react';

const CHARS = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF';

export default function RainCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 13;
    const cols = () => Math.floor(canvas.width / fontSize);
    let drops = Array(cols()).fill(1);

    let frame = 0;
    const draw = () => {
      frame++;
      if (frame % 2 !== 0) { animId = requestAnimationFrame(draw); return; } // 30fps

      ctx.fillStyle = 'rgba(0,4,7,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'VT323', monospace`;

      drops.forEach((y, i) => {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x    = i * fontSize;

        // Alternate between magenta and lime with occasional cyan
        const r = Math.random();
        if (r < 0.6)       ctx.fillStyle = 'rgba(255,0,179,0.55)';
        else if (r < 0.85) ctx.fillStyle = 'rgba(255,255,0,0.45)';
        else               ctx.fillStyle = 'rgba(0,255,255,0.35)';

        ctx.fillText(char, x, y * fontSize);

        // Bright head
        if (Math.random() > 0.97) {
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillText(char, x, y * fontSize);
        }

        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });

      // Sync drops array if window was resized
      const c = cols();
      if (drops.length !== c) drops = Array(c).fill(1).map((_, i) => drops[i] || 1);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 0, opacity: .18,
        pointerEvents: 'none',
      }}
    />
  );
}
