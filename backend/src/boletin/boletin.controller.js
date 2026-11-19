// src/boletin/boletin.controller.js
import { getBoletinData } from './boletin.service.js';
import { successResponse } from '../utils/responseHandler.js';

/**
 * GET /api/boletin/:id_matricula?periodo=N&year=YYYY
 */
export const getBoletin = async (req, res) => {
  const id_matricula   = Number(req.params.id_matricula);
  const numero_periodo = Number(req.query.periodo ?? 1);
  const year           = Number(req.query.year    ?? new Date().getFullYear());

  const data = await getBoletinData(id_matricula, numero_periodo, year);
  return successResponse(res, data);
};