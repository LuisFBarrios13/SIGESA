// src/notas/nota.controller.js
import {
  getNotasGrado,
  guardarNotasBulk,
  getNotasEstudiante,
  guardarNotasEstudiante,
} from './nota.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/** GET /api/notas?id_grado=&id_materia=&numero_periodo=&year= */
export const getNotas = async (req, res, next) => {
  try {
    const { id_grado, id_materia, numero_periodo, year } = req.query;
    if (!id_grado || !id_materia || !numero_periodo) {
      return errorResponse(res, 'id_grado, id_materia y numero_periodo son requeridos', 400);
    }
    const data = await getNotasGrado({
      id_grado:       Number(id_grado),
      id_materia:     Number(id_materia),
      numero_periodo: Number(numero_periodo),
      year:           year ? Number(year) : undefined,
    });
    return successResponse(res, data);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/** POST /api/notas/bulk — múltiples estudiantes, una materia */
export const guardarBulk = async (req, res, next) => {
  try {
    const { notas, id_materia, numero_periodo, year } = req.body;
    if (!Array.isArray(notas) || !id_materia || !numero_periodo || !year) {
      return errorResponse(res, 'notas[], id_materia, numero_periodo y year son requeridos', 400);
    }
    const data = await guardarNotasBulk(req.user.id, {
      notas,
      id_materia:     Number(id_materia),
      numero_periodo: Number(numero_periodo),
      year:           Number(year),
    });
    return successResponse(res, data, `${data.length} nota(s) guardada(s)`);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/**
 * GET /api/notas/estudiante/:id_matricula?numero_periodo=&year=
 * Devuelve { puesto, materias[] } — cada materia incluye nota, fallas, intensidad_horaria.
 */
export const getNotasDeEstudiante = async (req, res, next) => {
  try {
    const id_matricula   = Number(req.params.id_matricula);
    const numero_periodo = Number(req.query.numero_periodo ?? 1);
    const year           = Number(req.query.year ?? new Date().getFullYear());

    if (!id_matricula || numero_periodo < 1 || numero_periodo > 4) {
      return errorResponse(res, 'id_matricula válido y numero_periodo (1-4) son requeridos', 400);
    }

    const data = await getNotasEstudiante(id_matricula, numero_periodo, year);
    return successResponse(res, data);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/**
 * POST /api/notas/estudiante-bulk — múltiples materias, un estudiante.
 * Body: { id_matricula, numero_periodo, year, materias[], puesto? }
 *   Cada item de materias: { id_materia, nota?, fallas?, observacion? }
 *   puesto: número entero ≥ 1 | null (para borrarlo)
 */
export const guardarNotasDeEstudiante = async (req, res, next) => {
  try {
    const { id_matricula, numero_periodo, year, materias, puesto } = req.body;

    if (!id_matricula || !numero_periodo || !year || !Array.isArray(materias)) {
      return errorResponse(
        res,
        'id_matricula, numero_periodo, year y materias[] son requeridos',
        400,
      );
    }

    const data = await guardarNotasEstudiante(req.user.id, {
      id_matricula:   Number(id_matricula),
      numero_periodo: Number(numero_periodo),
      year:           Number(year),
      materias,
      puesto,           // undefined → no se toca; null → se borra; número → se guarda
    });

    return successResponse(res, data, `${data.length} nota(s) guardada(s)`);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};