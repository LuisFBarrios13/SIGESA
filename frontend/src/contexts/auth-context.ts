// src/contexts/auth-context.ts
// El objeto de contexto vive aparte del Provider para que Fast Refresh funcione
// (un archivo .tsx solo debe exportar componentes).
import { createContext } from 'react';
import type { AuthState } from '../types/auth';

export interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<void>;
}

// Context created with undefined default so consumers must be inside provider
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
