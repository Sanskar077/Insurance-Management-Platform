import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { clearAuthToken, getAuthToken, setAuthToken as persistToken } from '@lib/apiClient';
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
