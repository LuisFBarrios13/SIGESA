// src/grados/grado.controller.js
import { Grado, Docente } from '../models/index.js';
import { successResponse } from '../utils/responseHandler.js';
import { ORDEN_ESCOLAR } from '../constants/grados.js';

export const listarGrados = async (req, res) => {
  const grados = await Grado.findAll({
    include: [{ model: Docente, as: 'docente', attributes: ['cedula', 'nombre'] }],
    order: ORDEN_ESCOLAR,
  });
  return successResponse(res, grados);
};