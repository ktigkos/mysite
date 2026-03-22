import { useEffect, useRef } from 'react';

export default function GlitchText({ text, className = '', tag: Tag = 'span' }) {
  return (
    <Tag className={`glitch-wrap ${className}`} data-text={text}>
      <span className="glitch-main">{text}</span>
      <span className="glitch-layer1" aria-hidden>{text}</span>
      <span className="glitch-layer2" aria-hidden>{text}</span>
      <style>{`
        .glitch-wrap {
          position: relative;
          display: inline-block;
        }
        .glitch-layer1, .glitch-layer2 {
          position: absolute;
          inset: 0;
          display: inline-block;
        }
        .glitch-layer1 {
          color: var(--magenta);
          animation: glitch1 6s steps(1) infinite;
          opacity: .8;
        }
        .glitch-layer2 {
          color: var(--lime);
          animation: glitch2 6s steps(1) infinite;
          animation-delay: .1s;
          opacity: .7;
        }
      `}</style>
    </Tag>
  );
}
