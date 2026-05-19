// src/acudientes/acudiente.controller.js
import { actualizarAcudiente } from './acudiente.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * PATCH /api/acudientes/:cedula
 */
export const actualizar = async (req, res, next) => {
  try {
    const { cedula } = req.params;
    const data = await actualizarAcudiente(cedula, req.body);
    return successResponse(res, data, 'Acudiente actualizado correctamente');
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};