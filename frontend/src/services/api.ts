// src/services/api.ts

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'sigesa_token';

export const saveToken   = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const getToken    = ()           => localStorage.getItem(TOKEN_KEY);
export const removeToken = ()           => localStorage.removeItem(TOKEN_KEY);

interface ApiResponse<T> { success: boolean; message: string; data: T; }

// ── Sesión vencida ────────────────────────────────────────────
// Si una petición con token recibe 401, el token venció o es inválido.
// AuthProvider se suscribe aquí para cerrar la sesión y mandar al login.
let alExpirar: (() => void) | null = null;

export const suscribirSesionExpirada = (fn: () => void) => {
  alExpirar = fn;
  return () => { if (alExpirar === fn) alExpirar = null; };
};

/** true si el JWT ya venció según su campo "exp" (sin verificar la firma). */
export const tokenVencido = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true; // token malformado
  }
};

const buildHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const conToken = !!getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...buildHeaders(), ...options.headers },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  if (res.status === 401 && conToken) {
    alExpirar?.();
    throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');
  }

  // Una respuesta que no es JSON (p. ej. un proxy caído) no debe romper con un error críptico.
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok) throw new Error(body?.message ?? `Error en la solicitud (${res.status})`);
  if (!body) throw new Error('Respuesta inválida del servidor');
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