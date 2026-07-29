import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken as persistToken,
  SESSION_EXPIRED_EVENT,
} from '@lib/apiClient';
import type { Role } from '@app-types/customer.types';

interface DecodedToken {
  userId: string;
  role: Role;
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof json.userId === 'string' && typeof json.role === 'string') {
      return { userId: json.userId, role: json.role as Role };
    }
    return null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  token: string | null;
  role: Role | null;
  userId: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getAuthToken());

  const decoded = useMemo(() => (token ? decodeToken(token) : null), [token]);

  function setToken(newToken: string) {
    persistToken(newToken);
    setTokenState(newToken);
  }

  function logout() {
    clearAuthToken();
    setTokenState(null);
  }

  // Central session-expiry handling: apiClient fires this event on any 401
  // with a stored token, so a stale session logs out everywhere at once
  // (Protected routes then redirect to /login).
  useEffect(() => {
    function handleExpired() {
      clearAuthToken();
      setTokenState(null);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const value: AuthContextValue = {
    token,
    role: decoded?.role ?? null,
    userId: decoded?.userId ?? null,
    isAuthenticated: Boolean(decoded),
    setToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
