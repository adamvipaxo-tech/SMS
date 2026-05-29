import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sms_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('sms_username'));
  const [userId, setUserId] = useState(() => {
    const stored = localStorage.getItem('sms_userId');
    return stored ? Number(stored) : null;
  });

  const login = (newToken, name, id) => {
    localStorage.setItem('sms_token', newToken);
    localStorage.setItem('sms_username', name);
    localStorage.setItem('sms_userId', String(id));
    setToken(newToken);
    setUsername(name);
    setUserId(id);
  };

  const logout = () => {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_username');
    localStorage.removeItem('sms_userId');
    setToken(null);
    setUsername(null);
    setUserId(null);
  };

  const value = useMemo(
    () => ({ token, username, userId, isAuthenticated: !!token, login, logout }),
    [token, username, userId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
