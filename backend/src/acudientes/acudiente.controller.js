// src/acudientes/acudiente.controller.js
import { actualizarAcudiente, obtenerAcudiente } from './acudiente.service.js';
import { successResponse } from '../utils/responseHandler.js';

/**
 * GET /api/acudientes/:cedula
 * Busca un acudiente por cédula para auto-completar el formulario de matrícula.
 * Devuelve 404 si no existe (el frontend lo maneja como "acudiente nuevo").
 */
export const buscarPorCedula = async (req, res) => {
  const { cedula } = req.params;
  const data = await obtenerAcudiente(cedula);
  return successResponse(res, data);
};

/**
 * PATCH /api/acudientes/:cedula
 */
export const actualizar = async (req, res) => {
  const { cedula } = req.params;
  const data = await actualizarAcudiente(cedula, req.body);
  return successResponse(res, data, 'Acudiente actualizado correctamente');
};