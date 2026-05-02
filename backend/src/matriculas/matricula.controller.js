// src/matriculas/matricula.controller.js
import {
  crearMatriculaConAcudiente,
  listarMatriculas,
} from './matricula.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * POST /api/matriculas
 */
export const crear = async (req, res, next) => {
  try {
    const { estudiante, matricula, acudiente, relacion } = req.body;

    // Basic field validation — domain validation is in the service/model
    if (!estudiante?.numero_identidad || !estudiante?.nombre || !estudiante?.fecha_nacimiento) {
      return errorResponse(res, 'Datos del estudiante incompletos', 400);
    }
    if (!matricula?.id_grado || !matricula?.year) {
      return errorResponse(res, 'Datos de matrícula incompletos', 400);
    }
    if (!acudiente?.cedula || !acudiente?.nombre) {
      return errorResponse(res, 'Datos del acudiente incompletos', 400);
    }

    const result = await crearMatriculaConAcudiente({ estudiante, matricula, acudiente, relacion });
    return successResponse(res, result, 'Matrícula creada exitosamente', 201);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/**
 * GET /api/matriculas
 */
export const listar = async (req, res, next) => {
  try {
    const matriculas = await listarMatriculas();
    return successResponse(res, matriculas);
  } catch (err) {
    next(err);
  }
};