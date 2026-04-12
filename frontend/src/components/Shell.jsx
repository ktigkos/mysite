import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Lenis from 'lenis';
import ParticleField from './ParticleField';
import Cursor from './Cursor';
import styles from './Shell.module.css';

export default function Shell() {
  const [time,  setTime]  = useState('');
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Mouse coords for footer
  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className={styles.shell}>
      <ParticleField />
      <Cursor />

      <div className={`${styles.corner} ${styles.tl}`} />
      <div className={`${styles.corner} ${styles.tr}`} />
      <div className={`${styles.corner} ${styles.bl}`} />
      <div className={`${styles.corner} ${styles.br}`} />

      <header className={styles.hud}>
        <div className={styles.hudLeft}>
          <span className={styles.sys}>[ SYS ]</span>
          <NavLink to="/" className={styles.logo}>
            <span className={styles.logoMy}>MY</span>
            <span className={styles.logoDot}>.</span>
            <span className={styles.logoSite}>SITE</span>
          </NavLink>
          <span className={styles.online}>◉ ONLINE</span>
        </div>

        <nav className={styles.nav}>
          {[
            { to: '/',        label: 'HOME',     num: '01' },
            { to: '/contact', label: 'CONTACTS', num: '02' },
            { to: '/notepad', label: 'NOTEPAD',  num: '03' },
            { to: '/weather', label: 'WEATHER',  num: '04' },
          ].map(({ to, label, num }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
              <span className={styles.navNum}>{num}</span>
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.hudRight}>
          <span className={styles.clock}>{time}</span>
          <span className={styles.divider}>|</span>
          <span className={styles.sys}>v3.0</span>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <span className={styles.coords}>X:{mouse.x} Y:{mouse.y}</span>
        <span className={styles.copy}>© KASTORAS 2026</span>
      </footer>
    </div>
  );
}
