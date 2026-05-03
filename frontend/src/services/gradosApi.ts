// src/services/gradosApi.ts
// Extends the base api service with grado-specific calls.
// Single Responsibility: only grado-domain HTTP calls live here.

import { api } from './api';
import type {
  GradoConDocente,
  DocenteConDisponibilidad,
  AsignarDocentePayload,
} from '../types/grados';

export const gradosManagementApi = {
  /**
   * Lists all grados with their assigned docente.
   */
  listar: () => api.get<GradoConDocente[]>('/grados/disponibles'),

  /**
   * Lists docentes with availability metadata.
   */
  listarDocentesDisponibilidad: () =>
    api.get<DocenteConDisponibilidad[]>('/grados/docentes-disponibilidad'),

  /**
   * Assigns or removes a docente from a grado.
   * Pass null to remove the assignment.
   */
  asignarDocente: (id_grado: number, payload: AsignarDocentePayload) =>
    api.patch<GradoConDocente>(`/grados/${id_grado}/docente`, payload),

  /**
   * Creates a new grado.
   */
  crear: (nombre: string, jornada: 'MAÑANA' | 'TARDE') =>
    api.post<GradoConDocente>('/grados', { nombre, jornada }),
};