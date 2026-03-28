import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';

const NAV_LINKS = [
  { to: '/', end: true, label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/facilities', label: 'Facilities' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/donate', label: 'Donate' },
  { to: '/contact', label: 'Contact' },
];

export default function Header({ onProfileClick }) {
  const { isLoggedIn } = useSession();
  const { pathname } = useLocation();
  const trackRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [indicator, setIndicator] = useState({ x: 0, w: 0, visible: false });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('nav-mobile-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('nav-mobile-open');
    };
  }, [menuOpen]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    function updateIndicator() {
      if (!track) return;
      const active = track.querySelector('.nav-pill-link.active');
      if (!active) {
        setIndicator((s) => ({ ...s, visible: false }));
        return;
      }
      const tr = track.getBoundingClientRect();
      const ar = active.getBoundingClientRect();
      setIndicator({
        x: ar.left - tr.left,
        w: ar.width,
        visible: true,
      });
    }
    const id = requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    document.fonts?.ready?.then(() => {
      requestAnimationFrame(updateIndicator);
    });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [pathname]);

  return (
    <header className={`nav-header-floating${isLoggedIn ? ' logged-in' : ''}`}>
      {menuOpen ? (
        <button
          type="button"
          className="nav-drawer-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="nav-floating-inner">
        <NavLink to="/" className="nav-brand-mark" end>
          <img src="/images/logo.png" alt="Swagatham Foundation" className="nav-brand-logo" />
        </NavLink>

        <nav
          id="primary-navigation"
          className={`nav-pill-shell${menuOpen ? ' active' : ''}`}
          aria-label="Primary"
        >
          <div ref={trackRef} className="nav-pill-track">
            <span
              className="nav-pill-indicator"
              style={{
                width: indicator.w,
                transform: `translate(${indicator.x}px, -50%)`,
                top: '50%',
                opacity: indicator.visible ? 1 : 0,
              }}
            />
            <ul className="nav-pill-list">
              {NAV_LINKS.map(({ to, end, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) => `nav-pill-link${isActive ? ' active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="header-right nav-floating-actions">
          <div
            id="contactBtn"
            className="contact-button"
            style={{
              display: isLoggedIn ? 'none' : 'block',
              visibility: isLoggedIn ? 'hidden' : 'visible',
            }}
          >
            <a href="tel:+919677134399" className="cta-button">
              <i className="fas fa-phone" aria-hidden /> +91 96771 34399
            </a>
          </div>
          <button
            type="button"
            id="profileBtn"
            className={`profile-btn${isLoggedIn ? ' mobile-visible' : ''}`}
            aria-label="Open profile"
            style={{
              display: isLoggedIn ? 'flex' : 'none',
              visibility: isLoggedIn ? 'visible' : 'hidden',
            }}
            onClick={onProfileClick}
          >
            <i className="fas fa-user" aria-hidden /> <span className="profile-text">Profile</span>
          </button>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <i className={menuOpen ? 'fas fa-times' : 'fas fa-bars'} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
