// src/matriculas/matricula.controller.js
import {
  crearMatriculaConAcudiente,
  listarMatriculas,
  rematricular,
  cambiarEstadoMatricula,
} from './matricula.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * POST /api/matriculas
 */
export const crear = async (req, res) => {
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
};

/**
 * GET /api/matriculas
 */
export const listar = async (req, res) => {
  const matriculas = await listarMatriculas();
  return successResponse(res, matriculas);
};

/** POST /api/matriculas/rematricula — estudiante existente */
export const rematricula = async (req, res) => {
  const { id_estudiante, id_grado, year } = req.body;
  const data = await rematricular({ id_estudiante, id_grado, year });
  return successResponse(res, data, 'Estudiante matriculado', 201);
};

/** PATCH /api/matriculas/:id_matricula/estado — retirar o reactivar */
export const cambiarEstado = async (req, res) => {
  const data = await cambiarEstadoMatricula(req.params.id_matricula, req.body.estado);
  const mensaje = req.body.estado === 'RETIRADO' ? 'Estudiante retirado' : 'Matrícula reactivada';
  return successResponse(res, data, mensaje);
};
