// src/services/api.ts

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'sigesa_token';

export const saveToken  = (t: string)    => localStorage.setItem(TOKEN_KEY, t);
export const getToken   = ()             => localStorage.getItem(TOKEN_KEY);
export const removeToken = ()            => localStorage.removeItem(TOKEN_KEY);

interface ApiResponse<T> { success: boolean; message: string; data: T; }

const buildHeaders = (): HeadersInit => {
  const token = getToken();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res  = await fetch(`${BASE_URL}${path}`, { ...options, headers: { ...buildHeaders(), ...options.headers } });
  const body: ApiResponse<T> = await res.json();
  if (!res.ok) throw new Error(body.message ?? 'Error en la solicitud');
  return body.data;
}

export const api = {
  get:   <T>(path: string)               => request<T>(path, { method: 'GET' }),
  post:  <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Auth ──────────────────────────────────────────────────────
export interface LoginResult { token: string; user: import('../types/auth').AuthUser; }
export const authApi = {
  login:          (username: string, password: string) => api.post<LoginResult>('/auth/login', { username, password }),
  changePassword: (newPassword: string)                => api.patch<null>('/auth/change-password', { newPassword }),
};

// ── Shared types ──────────────────────────────────────────────
export type JornadaEstudiante = 'MAÑANA' | 'TARDE';
export type JornadaDocente    = 'MAÑANA' | 'TARDE' | 'COMPLETA';

// ── Grados ────────────────────────────────────────────────────
export interface Grado {
  id_grado: number;
  nombre: string;
  jornada: JornadaEstudiante;
  docente?: { cedula: string; nombre: string; jornada: JornadaDocente } | null;
}
export const gradosApi = { listar: () => api.get<Grado[]>('/grados') };

// ── Matrículas ────────────────────────────────────────────────
export interface MatriculaPayload {
  estudiante: { numero_identidad: string; nombre: string; fecha_nacimiento: string; rh?: string; direccion?: string; observaciones?: string; };
  matricula:  { id_grado: number; year: number; jornada: JornadaEstudiante; fecha_matricula?: string; };
  acudiente:  { cedula: string; nombre: string; telefono?: string; correo?: string; direccion?: string; };
  relacion?:  { parentesco?: string };
}
export interface MatriculaResult {
  matricula: Record<string, unknown>; estudiante: Record<string, unknown>;
  acudiente: Record<string, unknown>;
  credenciales: { username: string; passwordTemporal: string; nota: string };
}
export const matriculasApi = { crear: (p: MatriculaPayload) => api.post<MatriculaResult>('/matriculas', p) };

// ── Docentes ──────────────────────────────────────────────────
export interface DocentePayload {
  cedula: string; nombre: string; telefono?: string; correo?: string;
  jornada: JornadaDocente;
  nombreGrado: string;
}
export interface GradoAsignado   { id_grado: number; nombre: string; jornada: JornadaEstudiante; }
export interface DocenteResult   { docente: Record<string, unknown>; gradosAsignados: GradoAsignado[]; credenciales: { username: string; passwordTemporal: string; nota: string }; }
export interface DocenteListItem { cedula: string; nombre: string; telefono: string | null; correo: string | null; jornada: JornadaDocente; grados: GradoAsignado[]; }
export interface GradoDisponibilidad { id_grado: number; nombre: string; jornada: JornadaEstudiante; docente: { cedula: string; nombre: string; jornada: JornadaDocente } | null; }

export const docentesApi = {
  crear:           (p: DocentePayload) => api.post<DocenteResult>('/docentes', p),
  listar:          ()                  => api.get<DocenteListItem[]>('/docentes'),
  disponibilidad:  ()                  => api.get<GradoDisponibilidad[]>('/docentes/disponibilidad'),
};