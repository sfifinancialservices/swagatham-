import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import * as api from '../api/sessionApi';

const USER_SESSION_KEY = 'swagatham_user_session';

const SessionContext = createContext(null);

function readProfileComplete() {
  return localStorage.getItem('profileComplete') === 'true';
}

function getFallbackUser() {
  const name = localStorage.getItem('userName');
  const email = localStorage.getItem('userEmail');
  const phone = localStorage.getItem('userPhone');
  if (!name && !email && !phone) return null;
  return {
    name,
    email,
    phone,
    dob: localStorage.getItem('userDob'),
    gender: localStorage.getItem('userGender'),
    address: localStorage.getItem('userAddress'),
    familyMembers: [],
    payments: [],
    kycDocuments: null,
  };
}

export function SessionProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(USER_SESSION_KEY));
  const [profileComplete, setProfileComplete] = useState(readProfileComplete);

  const login = useCallback((newToken, complete = false) => {
    sessionStorage.setItem(USER_SESSION_KEY, newToken);
    localStorage.setItem('profileComplete', String(complete));
    setToken(newToken);
    setProfileComplete(complete);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem('profileComplete');
    [
      'userName',
      'userEmail',
      'userPhone',
      'userDob',
      'userGender',
      'userAddress',
    ].forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setProfileComplete(false);
  }, []);

  const isLoggedIn = !!token;

  const fetchUserProfile = useCallback(async () => {
    if (!token) return getFallbackUser();
    try {
      const user = await api.fetchUserProfile(token);
      if (user?.name) localStorage.setItem('userName', user.name);
      if (user?.email) localStorage.setItem('userEmail', user.email);
      if (user?.phone) localStorage.setItem('userPhone', user.phone);
      if (user?.dob) localStorage.setItem('userDob', user.dob);
      if (user?.gender) localStorage.setItem('userGender', user.gender);
      if (user?.address) localStorage.setItem('userAddress', user.address);
      if (user && typeof user.profileComplete !== 'undefined') {
        const pc = Boolean(user.profileComplete);
        localStorage.setItem('profileComplete', String(pc));
        setProfileComplete(pc);
      }
      return user;
    } catch (e) {
      if (e.status === 401) logout();
      return getFallbackUser();
    }
  }, [token, logout]);

  const updateUserProfile = useCallback(
    async (profileData) => {
      if (!token) return false;
      try {
        await api.updateUserProfile(token, profileData);
        localStorage.setItem('profileComplete', 'true');
        setProfileComplete(true);
        return true;
      } catch {
        return false;
      }
    },
    [token]
  );

  const submitKYC = useCallback(
    async (kyc) => {
      if (!token) throw new Error('Not authenticated');
      return api.submitKYC(token, kyc);
    },
    [token]
  );

  const recordPayment = useCallback(
    async (paymentData) => {
      if (!token) throw new Error('Not authenticated');
      return api.recordPayment(token, paymentData);
    },
    [token]
  );

  const value = useMemo(
    () => ({
      token,
      isLoggedIn,
      profileComplete,
      login,
      logout,
      fetchUserProfile,
      updateUserProfile,
      submitKYC,
      recordPayment,
      setProfileComplete: (v) => {
        localStorage.setItem('profileComplete', String(v));
        setProfileComplete(v);
      },
    }),
    [
      token,
      isLoggedIn,
      profileComplete,
      login,
      logout,
      fetchUserProfile,
      updateUserProfile,
      submitKYC,
      recordPayment,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
