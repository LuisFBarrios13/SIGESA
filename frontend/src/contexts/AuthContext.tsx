// src/contexts/AuthContext.tsx
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  authApi, saveToken, getToken, removeToken, suscribirSesionExpirada, tokenVencido,
} from '../services/api';
import type { AuthUser } from '../types/auth';
import { AuthContext } from './auth-context';

// ── Rehidratación desde localStorage ──────────────────────────

interface StoredSession {
  token: string | null;
  user: AuthUser | null;
  /** Había sesión guardada pero el token ya venció. */
  expirada: boolean;
}

const readStoredSession = (): StoredSession => {
  const storedToken = getToken();
  const storedUser = localStorage.getItem('sigesa_user');

  // Un token que ya venció no sirve: se descarta antes de mostrar la app.
  const expirada = !!storedToken && !!storedUser && tokenVencido(storedToken);
  if (storedToken && storedUser && !expirada) {
    try {
      return { token: storedToken, user: JSON.parse(storedUser) as AuthUser, expirada: false };
    } catch {
      // JSON corrupto: se limpia abajo
    }
  }
  removeToken();
  localStorage.removeItem('sigesa_user');
  return { token: null, user: null, expirada };
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
  const queryClient = useQueryClient();
  const [sesionExpirada, setSesionExpirada] = useState(session.expirada);

  const login = async (username: string, password: string): Promise<void> => {
    const result = await authApi.login(username, password);
    setSesionExpirada(false);
    // Por si quedó caché de una sesión anterior (p. ej. token vencido sin logout).
    queryClient.clear();
    saveToken(result.token);
    localStorage.setItem('sigesa_user', JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
  };

  const logout = useCallback((): void => {
    // Borrar la caché: si otra persona inicia sesión en este navegador
    // no debe ver datos del usuario anterior.
    queryClient.clear();
    removeToken();
    localStorage.removeItem('sigesa_user');
    setToken(null);
    setUser(null);
  }, [queryClient]);

  // Si la API responde 401 (token vencido), se cierra la sesión; las rutas
  // protegidas redirigen al login, que muestra el aviso.
  useEffect(() => suscribirSesionExpirada(() => {
    setSesionExpirada(true);
    logout();
  }), [logout]);

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
        sesionExpirada,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};