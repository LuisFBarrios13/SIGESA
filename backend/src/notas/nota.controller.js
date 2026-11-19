// src/notas/nota.controller.js
import {
  getNotasGrado,
  guardarNotasBulk,
  getNotasEstudiante,
  guardarNotasEstudiante,
} from './nota.service.js';
import { successResponse } from '../utils/responseHandler.js';

/** GET /api/notas?id_grado=&id_materia=&numero_periodo=&year= */
export const getNotas = async (req, res) => {
  const { id_grado, id_materia, numero_periodo, year } = req.query;
  const data = await getNotasGrado({
    id_grado:       Number(id_grado),
    id_materia:     Number(id_materia),
    numero_periodo: Number(numero_periodo),
    year:           year ? Number(year) : undefined,
  });
  return successResponse(res, data);
};

/** POST /api/notas/bulk — múltiples estudiantes, una materia */
export const guardarBulk = async (req, res) => {
  const { notas, id_materia, numero_periodo, year } = req.body;
  const data = await guardarNotasBulk(req.user.id, {
    notas,
    id_materia:     Number(id_materia),
    numero_periodo: Number(numero_periodo),
    year:           Number(year),
  });
  return successResponse(res, data, `${data.length} nota(s) guardada(s)`);
};

/**
 * GET /api/notas/estudiante/:id_matricula?numero_periodo=&year=
 * Devuelve { puesto, materias[] } — cada materia incluye nota, fallas, intensidad_horaria.
 */
export const getNotasDeEstudiante = async (req, res) => {
  const id_matricula   = Number(req.params.id_matricula);
  const numero_periodo = Number(req.query.numero_periodo ?? 1);
  const year           = Number(req.query.year ?? new Date().getFullYear());

  const data = await getNotasEstudiante(id_matricula, numero_periodo, year);
  return successResponse(res, data);
};

/**
 * POST /api/notas/estudiante-bulk — múltiples materias, un estudiante.
 * Body: { id_matricula, numero_periodo, year, materias[], puesto?, observaciones? }
 *   Cada item de materias: { id_materia, nota?, fallas?, observacion? }
 *   puesto: número entero ≥ 1 | null (para borrarlo)
 */
export const guardarNotasDeEstudiante = async (req, res) => {
  const { id_matricula, numero_periodo, year, materias, puesto, observaciones } = req.body;

  const data = await guardarNotasEstudiante(req.user.id, {
    id_matricula:   Number(id_matricula),
    numero_periodo: Number(numero_periodo),
    year:           Number(year),
    materias,
    puesto,           // undefined → no se toca; null → se borra; número → se guarda
    observaciones,    // undefined → no se toca; '' → se borra
  });

  return successResponse(res, data, `${data.length} nota(s) guardada(s)`);
};