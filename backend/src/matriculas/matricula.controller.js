// src/matriculas/matricula.controller.js
import {
  crearMatriculaConAcudiente,
  listarMatriculas,
  rematricular,
  cambiarEstadoMatricula,
  duenoDocumento,
  obtenerPeriodo,
  destinoRematricula,
} from './matricula.service.js';
import { successResponse } from '../utils/responseHandler.js';

/**
 * POST /api/matriculas
 */
export const crear = async (req, res) => {
  // Formato validado en matricula.routes.js; las reglas del negocio, en el servicio.
  const { estudiante, matricula, acudiente, relacion } = req.body;

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
  const { id_estudiante, id_grado } = req.body;
  const data = await rematricular({ id_estudiante, id_grado });
  return successResponse(res, data, 'Estudiante matriculado', 201);
};

/** GET /api/matriculas/documento/:documento — ¿de quién es? (docente, acudiente, otra cuenta o nadie) */
export const documento = async (req, res) => {
  const data = await duenoDocumento(req.params.documento);
  return successResponse(res, data);
};

/** PATCH /api/matriculas/:id_matricula/estado — retirar o reactivar */
export const cambiarEstado = async (req, res) => {
  const data = await cambiarEstadoMatricula(req.params.id_matricula, req.body.estado, { conPromocion: req.body.conPromocion === true });
  const mensaje = req.body.estado === 'RETIRADO' ? 'Estudiante retirado' : 'Matrícula reactivada';
  return successResponse(res, data, mensaje);
};

/** GET /api/matriculas/periodo — años en que se puede matricular hoy */
export const periodo = (req, res) => successResponse(res, obtenerPeriodo());

/** GET /api/matriculas/rematricula/:id_estudiante — para qué año se rematricularía hoy */
export const destino = async (req, res) => {
  const { status, ...data } = await destinoRematricula(req.params.id_estudiante);
  return successResponse(res, data);
};
