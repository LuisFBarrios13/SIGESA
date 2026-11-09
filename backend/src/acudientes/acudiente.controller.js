// src/acudientes/acudiente.controller.js
import { actualizarAcudiente, buscarAcudiente } from './acudiente.service.js';
import { successResponse } from '../utils/responseHandler.js';

/**
 * GET /api/acudientes/:cedula
 * Busca un acudiente por cédula (o por su usuario) para auto-completar el
 * formulario de matrícula. data = null si no existe (acudiente nuevo).
 */
export const buscarPorCedula = async (req, res) => {
  const data = await buscarAcudiente(req.params.cedula);
  return successResponse(res, data, data ? 'Acudiente encontrado' : 'Acudiente no registrado');
};

/**
 * PATCH /api/acudientes/:cedula
 */
export const actualizar = async (req, res) => {
  const { cedula } = req.params;
  const data = await actualizarAcudiente(cedula, req.body);
  return successResponse(res, data, 'Acudiente actualizado correctamente');
};