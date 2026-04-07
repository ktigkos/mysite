import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import RainCanvas from './RainCanvas';
import styles from './Shell.module.css';

export default function Shell() {
  const [time,  setTime]  = useState('');
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className={styles.shell}>
      <RainCanvas />

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
            { to: '/',        label: 'HOME',    num: '01' },
            { to: '/contact', label: 'CONTACT', num: '02' },
            { to: '/notepad', label: 'NOTEPAD', num: '03' },
            { to: '/weather', label: 'WEATHER', num: '04' },
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
        <div className={styles.footerLinks}>
          <a href="snake.html"   className={styles.flink}>▸ SNAKE</a>
          <span className={styles.divider}>·</span>
          <a href="snake3d.html" className={styles.flink}>▸ SNAKE_3D</a>
        </div>
        <span className={styles.copy}>© MYSITE CORP 2025</span>
      </footer>
    </div>
  );
}
