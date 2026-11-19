// src/acudientes/acudiente.controller.js
import { actualizarAcudiente, buscarAcudiente, buscarCoincidencias } from './acudiente.service.js';
import { successResponse } from '../utils/responseHandler.js';

/**
 * GET /api/acudientes?q=
 * Coincidencias por nombre o cédula (hasta 20) mientras se escribe en la matrícula.
 */
export const coincidencias = async (req, res) => {
  // q ya viene validado; en Express 5 req.query no se puede reescribir, así que se recorta aquí.
  const data = await buscarCoincidencias(req.query.q.trim());
  return successResponse(res, data);
};

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