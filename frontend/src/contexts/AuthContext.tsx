// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, saveToken, getToken, removeToken } from '../services/api';
import type { AuthUser, AuthState } from '../types/auth';

// ── Context shape ─────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<void>;
}

// Context created with undefined default so consumers must be inside provider
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Manages auth state across the app.
 * Single Responsibility: authentication lifecycle only.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = localStorage.getItem('sigesa_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        removeToken();
        localStorage.removeItem('sigesa_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    const result = await authApi.login(username, password);
    saveToken(result.token);
    localStorage.setItem('sigesa_user', JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
  };

  const logout = (): void => {
    removeToken();
    localStorage.removeItem('sigesa_user');
    setToken(null);
    setUser(null);
  };

  const changePassword = async (newPassword: string): Promise<void> => {
    await authApi.changePassword(newPassword);
    if (user) {
      const updated: AuthUser = { ...user, primerLogin: false };
      localStorage.setItem('sigesa_user', JSON.stringify(updated));
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};