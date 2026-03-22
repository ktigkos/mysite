import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function Home() {
  const [lines,    setLines]    = useState([]);
  const [bootDone, setBootDone] = useState(false);
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

  const cards = [
    { num:'01', label:'SNAKE',    desc:'Classic 2D arcade. Eat. Grow. Die.', href:'snake.html',   color:'magenta', icon:'🐍', external: true  },
    { num:'02', label:'SNAKE_3D', desc:'Three dimensions. One serpent.',      href:'snake3d.html', color:'lime',    icon:'🌀', external: true  },
    { num:'03', label:'CONTACTS', desc:'Write records to the database.',      href:'/contact',     color:'cyan',    icon:'◈',  external: false },
    { num:'04', label:'NOTEPAD',  desc:'Real-time WebSocket sync.',           href:'/notepad',     color:'orange',  icon:'◎',  external: false },
  ];

  return (
    <div className={styles.home}>

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
          <div className={styles.eyebrow}>// SYSTEM READY — AWAITING INPUT</div>
          <h1 className={styles.title}>
            <GlitchText text="MY.SITE" tag="span" className={styles.titleGlitch} />
          </h1>
          <p className={styles.sub}>
            Personal cyberdeck. Games. Data. Notes.
          </p>

          <div className={styles.cards}>
            {cards.map(({ num, label, desc, href, color, icon, external }) => (
              external
                ? <a key={num} href={href} className={`${styles.card} ${styles[color]}`}>
                    <CardInner num={num} label={label} desc={desc} icon={icon} />
                  </a>
                : <button key={num} className={`${styles.card} ${styles[color]}`}
                    onClick={() => navigate(href)}>
                    <CardInner num={num} label={label} desc={desc} icon={icon} />
                  </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CardInner({ num, label, desc, icon }) {
  return <>
    <div className={styles.cardNum}>{num}</div>
    <div className={styles.cardIcon}>{icon}</div>
    <div className={styles.cardLabel}>{label}</div>
    <div className={styles.cardDesc}>{desc}</div>
    <div className={styles.cardArrow}>↗</div>
  </>;
}
