// src/acudientes/acudiente.controller.js
import { actualizarAcudiente, obtenerAcudiente } from './acudiente.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * GET /api/acudientes/:cedula
 * Busca un acudiente por cédula para auto-completar el formulario de matrícula.
 * Devuelve 404 si no existe (el frontend lo maneja como "acudiente nuevo").
 */
export const buscarPorCedula = async (req, res, next) => {
  try {
    const { cedula } = req.params;
    const data = await obtenerAcudiente(cedula);
    return successResponse(res, data);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

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