import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import './styles/header-footer.css';
import './styles/home.css';
import './styles/about.css';
import './styles/contact.css';
import './styles/donate.css';
import './styles/facilities.css';
import './styles/gallery.css';
import './styles/editorial-theme.css';
import './styles/admin.css';
import App from './App.jsx';
import { SessionProvider } from './context/SessionContext.jsx';
import { AdminProvider } from './context/AdminContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionProvider>
      <AdminProvider>
        <App />
      </AdminProvider>
    </SessionProvider>
  </StrictMode>
);
