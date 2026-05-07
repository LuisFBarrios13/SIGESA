// src/estudiantes/estudiante.controller.js
import {
  listarEstudiantes,
  obtenerEstudiante,
  actualizarEstudiante,
  buscarEstudiantes,
} from './estudiante.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/** GET /api/estudiantes */
export const listar = async (req, res, next) => {
  try {
    const data = await listarEstudiantes();
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

/** GET /api/estudiantes/buscar?q= */
export const buscar = async (req, res, next) => {
  try {
    const { q = '' } = req.query;
    if (!q.trim()) return errorResponse(res, 'El parámetro q es requerido', 400);
    const data = await buscarEstudiantes(q.trim());
    return successResponse(res, data);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/** GET /api/estudiantes/:id */
export const obtener = async (req, res, next) => {
  try {
    const data = await obtenerEstudiante(req.params.id);
    return successResponse(res, data);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/** PATCH /api/estudiantes/:id */
export const actualizar = async (req, res, next) => {
  try {
    const data = await actualizarEstudiante(req.params.id, req.body);
    return successResponse(res, data, 'Estudiante actualizado correctamente');
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};