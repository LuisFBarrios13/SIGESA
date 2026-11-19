// src/estudiantes/estudiante.controller.js
import {
  listarEstudiantes,
  obtenerEstudiante,
  actualizarEstudiante,
  buscarEstudiantes,
} from './estudiante.service.js';
import { successResponse } from '../utils/responseHandler.js';

/** GET /api/estudiantes */
export const listar = async (req, res) => {
  const data = await listarEstudiantes();
  return successResponse(res, data);
};

/** GET /api/estudiantes/buscar?q= */
export const buscar = async (req, res) => {
  // q ya viene validado; en Express 5 req.query no se puede reescribir, así que se recorta aquí.
  const data = await buscarEstudiantes(req.query.q.trim());
  return successResponse(res, data);
};

/** GET /api/estudiantes/:id */
export const obtener = async (req, res) => {
  const data = await obtenerEstudiante(req.params.id);
  return successResponse(res, data);
};

/** PATCH /api/estudiantes/:id */
export const actualizar = async (req, res) => {
  const data = await actualizarEstudiante(req.params.id, req.body);
  return successResponse(res, data, 'Estudiante actualizado correctamente');
};