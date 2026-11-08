// src/portal-acudiente/acudiente.portal.controller.js
import { getMisEstudiantes, getResumenPagos } from './acudiente.portal.service.js';
import { successResponse, errorResponse }     from '../utils/responseHandler.js';

/** GET /api/acudiente/mis-estudiantes */
export const misEstudiantes = async (req, res, next) => {
  try {
    const data = await getMisEstudiantes(req.user.id);
    return successResponse(res, data);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/** GET /api/acudiente/pagos/:id_matricula */
export const resumenPagos = async (req, res, next) => {
  try {
    const id_matricula = Number(req.params.id_matricula);
    if (!id_matricula) return errorResponse(res, 'id_matricula inválido', 400);
    const data = await getResumenPagos(req.user.id, id_matricula);
    return successResponse(res, data);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};