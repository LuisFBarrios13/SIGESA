// src/boletin/boletin.controller.js
import { getBoletinData }                from './boletin.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/** GET /api/boletin/:id_matricula?periodo=&year= */
export const getBoletin = async (req, res, next) => {
  try {
    const id_matricula = Number(req.params.id_matricula);
    const periodo      = Number(req.query.periodo ?? 1);
    const year         = Number(req.query.year ?? new Date().getFullYear());

    if (!id_matricula || periodo < 1 || periodo > 4) {
      return errorResponse(res, 'id_matricula válido y periodo (1-4) son requeridos', 400);
    }

    const data = await getBoletinData(id_matricula, periodo, year);
    return successResponse(res, data);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};