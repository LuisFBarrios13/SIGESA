// src/types/auth.ts

export interface AuthUser {
  id: number;
  username: string;
  roles: string[];
  primerLogin: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}