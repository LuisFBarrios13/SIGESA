// src/contexts/AuthContext.tsx
import { useState, type ReactNode } from 'react';
import { authApi, saveToken, getToken, removeToken } from '../services/api';
import type { AuthUser } from '../types/auth';
import { AuthContext } from './auth-context';

// ── Rehidratación desde localStorage ──────────────────────────

interface StoredSession {
  token: string | null;
  user: AuthUser | null;
}

const readStoredSession = (): StoredSession => {
  const storedToken = getToken();
  const storedUser = localStorage.getItem('sigesa_user');

  if (storedToken && storedUser) {
    try {
      return { token: storedToken, user: JSON.parse(storedUser) as AuthUser };
    } catch {
      removeToken();
      localStorage.removeItem('sigesa_user');
    }
  }
  return { token: null, user: null };
};

// ── Provider ──────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Manages auth state across the app.
 * Single Responsibility: authentication lifecycle only.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // La sesión se lee de forma síncrona en el primer render (lazy init),
  // así no hace falta un useEffect ni un estado de carga intermedio.
  const [session] = useState(readStoredSession);
  const [user, setUser] = useState<AuthUser | null>(session.user);
  const [token, setToken] = useState<string | null>(session.token);
  const isLoading = false;

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