// src/services/api.ts

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'sigesa_token';

// ── Token helpers ─────────────────────────────────────────────

export const saveToken = (token: string): void =>
  localStorage.setItem(TOKEN_KEY, token);

export const getToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY);

export const removeToken = (): void =>
  localStorage.removeItem(TOKEN_KEY);

// ── HTTP primitives ───────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const buildHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...buildHeaders(), ...options.headers },
  });

  const body: ApiResponse<T> = await res.json();

  if (!res.ok) {
    throw new Error(body.message ?? 'Error en la solicitud');
  }

  return body.data;
}

// ── Public API object (Dependency Inversion: depend on this, not on fetch) ──

export const api = {
  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Domain helpers ────────────────────────────────────────────

export interface LoginResult {
  token: string;
  user: import('../types/auth').AuthUser;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResult>('/auth/login', { username, password }),

  changePassword: (newPassword: string) =>
    api.patch<null>('/auth/change-password', { newPassword }),
};

export interface Grado {
  id_grado: number;
  nombre: string;
  jornada: 'MAÑANA' | 'TARDE';
  docente?: { cedula: string; nombre: string } | null;
}

export const gradosApi = {
  listar: () => api.get<Grado[]>('/grados'),
};

export interface MatriculaPayload {
  estudiante: {
    numero_identidad: string;
    nombre: string;
    fecha_nacimiento: string;
    rh?: string;
    direccion?: string;
    observaciones?: string;
  };
  matricula: {
    id_grado: number;
    year: number;
    /** Jornada en la que cursará el estudiante: MAÑANA o TARDE */
    jornada: 'MAÑANA' | 'TARDE';
    fecha_matricula?: string;
  };
  acudiente: {
    cedula: string;
    nombre: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
  };
  relacion?: { parentesco?: string };
}

export interface MatriculaResult {
  matricula: Record<string, unknown>;
  estudiante: Record<string, unknown>;
  acudiente: Record<string, unknown>;
  credenciales: { username: string; passwordTemporal: string; nota: string };
}

export const matriculasApi = {
  crear: (payload: MatriculaPayload) =>
    api.post<MatriculaResult>('/matriculas', payload),
};