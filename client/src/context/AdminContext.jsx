import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ADMIN_SESSION_KEY = 'swagatham_admin_session';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY));

  const adminLogin = useCallback((token) => {
    sessionStorage.setItem(ADMIN_SESSION_KEY, token);
    setAdminToken(token);
  }, []);

  const adminLogout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminToken(null);
  }, []);

  const isAdminLoggedIn = !!adminToken;

  const value = useMemo(
    () => ({
      adminToken,
      isAdminLoggedIn,
      adminLogin,
      adminLogout,
    }),
    [adminToken, adminLogin, adminLogout]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
