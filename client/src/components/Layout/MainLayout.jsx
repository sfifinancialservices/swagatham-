import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ProfileModals from '../Profile/ProfileModals';

const BODY_CLASS = {
  '/': 'index-page',
  '/about': 'about-page',
  '/contact': 'contact-page',
  '/donate': 'donate-page',
  '/facilities': 'facilities-page',
  '/gallery': 'gallery-page',
};

export default function MainLayout() {
  const { pathname } = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const cls = BODY_CLASS[pathname] || '';
    document.body.className = `editorial-app ${cls}`.trim();
    return () => {
      document.body.className = '';
    };
  }, [pathname]);

  return (
    <>
      <Header onProfileClick={() => setProfileOpen(true)} />
      <Outlet />
      <Footer />
      <ProfileModals open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
