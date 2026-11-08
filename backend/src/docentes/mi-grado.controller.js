// src/docentes/mi-grado.controller.js
// Single Responsibility: HTTP boundary — parse request, call service, return response.

import { getPerfilDocente, getEstudiantesDocente } from './mi-grado.service.js';
import { successResponse }          from '../utils/responseHandler.js';

/** GET /api/docente/perfil */
export const getPerfil = async (req, res) => {
  const data = await getPerfilDocente(req.user.id);
  return successResponse(res, data);
};

/** GET /api/docente/estudiantes?year=YYYY */
export const getEstudiantes = async (req, res) => {
  const year = req.query.year ? Number(req.query.year) : undefined;
  const data = await getEstudiantesDocente(req.user.id, year);
  return successResponse(res, data);
};