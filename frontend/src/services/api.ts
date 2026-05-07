// src/services/api.ts

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'sigesa_token';

export const saveToken   = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const getToken    = ()           => localStorage.getItem(TOKEN_KEY);
export const removeToken = ()           => localStorage.removeItem(TOKEN_KEY);

interface ApiResponse<T> { success: boolean; message: string; data: T; }

const buildHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res  = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...buildHeaders(), ...options.headers },
  });
  const body: ApiResponse<T> = await res.json();
  if (!res.ok) throw new Error(body.message ?? 'Error en la solicitud');
  return body.data;
}

export const api = {
  get:   <T>(path: string)                => request<T>(path, { method: 'GET' }),
  post:  <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Imports desde types/ ──────────────────────────────────────

import type { LoginResult, Grado }                 from '../types/shared';
import type { MatriculaPayload, MatriculaResult }  from '../types/matriculas';
import type { DocentePayload, DocenteResult, DocenteListItem, GradoDisponibilidad } from '../types/docentes';
import type { EstudianteListItem, EstudianteDetalle, ActualizarEstudiantePayload }  from '../types/estudiantes';

// ── Re-exports ────────────────────────────────────────────────
// Las páginas siguen importando desde este archivo sin necesidad de cambios.

export type { LoginResult, JornadaEstudiante, JornadaDocente, Grado } from '../types/shared';
export type { MatriculaPayload, MatriculaResult, MatriculaListItem }   from '../types/matriculas';
export type { DocentePayload, GradoAsignado, DocenteResult, DocenteListItem, GradoDisponibilidad } from '../types/docentes';
export type { GradoResumen, EstudianteListItem, EstudianteDetalle, ActualizarEstudiantePayload }    from '../types/estudiantes';

// ── Auth ──────────────────────────────────────────────────────

export const authApi = {
  login:          (username: string, password: string) =>
    api.post<LoginResult>('/auth/login', { username, password }),
  changePassword: (newPassword: string) =>
    api.patch<null>('/auth/change-password', { newPassword }),
};

// ── Grados ────────────────────────────────────────────────────

export const gradosApi = {
  listar: () => api.get<Grado[]>('/grados'),
};

// ── Matrículas ────────────────────────────────────────────────

export const matriculasApi = {
  crear: (p: MatriculaPayload) => api.post<MatriculaResult>('/matriculas', p),
};

// ── Docentes ──────────────────────────────────────────────────

export const docentesApi = {
  crear:          (p: DocentePayload) => api.post<DocenteResult>('/docentes', p),
  listar:         ()                  => api.get<DocenteListItem[]>('/docentes'),
  disponibilidad: ()                  => api.get<GradoDisponibilidad[]>('/docentes/disponibilidad'),
};

// ── Estudiantes ───────────────────────────────────────────────

export const estudiantesApi = {
  listar:     () =>
    api.get<EstudianteListItem[]>('/estudiantes'),
  buscar:     (q: string) =>
    api.get<EstudianteListItem[]>(`/estudiantes/buscar?q=${encodeURIComponent(q)}`),
  obtener:    (id: string) =>
    api.get<EstudianteDetalle>(`/estudiantes/${id}`),
  actualizar: (id: string, payload: ActualizarEstudiantePayload) =>
    api.patch<EstudianteListItem>(`/estudiantes/${id}`, payload),
};