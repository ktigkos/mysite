import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import GlitchText from '../components/GlitchText';
import styles from './Home.module.css';

const BOOT_LINES = [
  '> INITIALISING NEO-TERMINAL v3.0...',
  '> LOADING CYBERDECK INTERFACE......',
  '> NEURAL LINK ESTABLISHED [OK].....',
  '> CONNECTING TO CONTACTS_DB [OK]...',
  '> WEBSOCKET DAEMON [ACTIVE]........',
  '> ALL SYSTEMS NOMINAL — JACK IN.',
];

const CARDS = [
  { num:'01', label:'SNAKE',    desc:'Classic 2D arcade. Eat. Grow. Die.',  back:'Launch the classic snake game.',    href:'snake.html',   color:'magenta', icon:'🐍', external: true  },
  { num:'02', label:'SNAKE_3D', desc:'Three dimensions. One serpent.',       back:'Enter the 3D arena.',               href:'snake3d.html', color:'violet',  icon:'🌀', external: true  },
  { num:'03', label:'CONTACTS', desc:'Write records to the database.',       back:'Manage your contact database.',     href:'/contact',     color:'blue',    icon:'◈',  external: false },
  { num:'04', label:'NOTEPAD',  desc:'Real-time WebSocket sync.',            back:'Open the live synced notepad.',     href:'/notepad',     color:'indigo',  icon:'◎',  external: false },
  { num:'05', label:'WEATHER',  desc:'Live weather for any location.',       back:'Check current weather conditions.', href:'/weather',     color:'cyan',    icon:'🌤', external: false },
  { num:'06', label:'GALLERY',  desc:'Search & download images.',            back:'Browse the image gallery.',         href:'/gallery',     color:'lime',    icon:'🖼', external: false },
];

export default function Home() {
  const [lines,    setLines]    = useState([]);
  const [bootDone, setBootDone] = useState(false);
  const heroRef  = useRef(null);
  const cardsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let i = 0;
    const run = () => {
      if (i < BOOT_LINES.length) {
        setLines(prev => [...prev, BOOT_LINES[i++]]);
        setTimeout(run, 220);
      } else {
        setTimeout(() => setBootDone(true), 350);
      }
    };
    run();
  }, []);

  // GSAP entrance after boot
  useEffect(() => {
    if (!bootDone) return;
    const ctx = gsap.context(() => {
      // Eyebrow
      gsap.from('[data-anim="eyebrow"]', {
        opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
      });
      // Title chars
      gsap.from('[data-anim="title"]', {
        opacity: 0, y: 60, skewY: 4, duration: 0.9, ease: 'power4.out', delay: 0.15,
      });
      // Sub
      gsap.from('[data-anim="sub"]', {
        opacity: 0, y: 20, duration: 0.6, ease: 'power3.out', delay: 0.35,
      });
      // Cards stagger
      gsap.from('[data-anim="card"]', {
        opacity: 0, y: 50, rotateX: 15, duration: 0.7, stagger: 0.1,
        ease: 'power3.out', delay: 0.5,
      });
    }, heroRef);
    return () => ctx.revert();
  }, [bootDone]);

  return (
    <div className={styles.home} ref={heroRef}>

      {/* Boot terminal */}
      {!bootDone && (
        <div className={styles.terminal}>
          <div className={styles.termBar}>
            <span className={`${styles.dot} ${styles.red}`}/>
            <span className={`${styles.dot} ${styles.yellow}`}/>
            <span className={`${styles.dot} ${styles.green}`}/>
            <span className={styles.termTitle}>BOOT_SEQUENCE.EXE</span>
          </div>
          <div className={styles.termBody}>
            {lines.map((l, i) => (
              <div key={i} className={styles.termLine}>{l}</div>
            ))}
            <span className={styles.cursor}>█</span>
          </div>
        </div>
      )}

      {/* Hero */}
      {bootDone && (
        <div className={styles.hero}>
          <div className={styles.eyebrow} data-anim="eyebrow">// SYSTEM READY — AWAITING INPUT</div>
          <h1 className={styles.title} data-anim="title">
            <GlitchText text="MY.SITE" tag="span" className={styles.titleGlitch} />
          </h1>
          <p className={styles.sub} data-anim="sub">
            Personal cyberdeck. Games. Data. Notes.
          </p>

          <div className={styles.cards} ref={cardsRef}>
            {CARDS.map((card) => (
              <FlipCard key={card.num} card={card} navigate={navigate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlipCard({ card, navigate }) {
  const { num, label, desc, back, href, color, icon, external } = card;
  const [flipped, setFlipped] = useState(false);
  const innerRef = useRef(null);

  const go = (e) => {
    e.stopPropagation();
    if (external) window.location.href = href;
    else navigate(href);
  };

  return (
    <div
      className={`${styles.flipWrap} ${styles[color]}`}
      data-anim="card"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped(f => !f)}
    >
      <div ref={innerRef} className={`${styles.flipInner} ${flipped ? styles.flipped : ''}`}>

        {/* Front */}
        <div className={styles.flipFront}>
          <div className={styles.cardNum}>{num}</div>
          <div className={styles.cardIcon}>{icon}</div>
          <div className={styles.cardLabel}>{label}</div>
          <div className={styles.cardDesc}>{desc}</div>
          <div className={styles.cardArrow}>↗</div>
        </div>

        {/* Back */}
        <div className={styles.flipBack}>
          <div className={styles.backIcon}>{icon}</div>
          <div className={styles.backText}>{back}</div>
          <button className={styles.backBtn} onClick={go}>
            ENTER <span>→</span>
          </button>
        </div>

      </div>
    </div>
  );
}
