// src/grados/grado.controller.js
import { Grado, Docente } from '../models/index.js';
import { successResponse } from '../utils/responseHandler.js';

export const listarGrados = async (req, res, next) => {
  try {
    const grados = await Grado.findAll({
      include: [{ model: Docente, as: 'docente', attributes: ['cedula', 'nombre'] }],
      order: [['nombre', 'ASC']],
    });
    return successResponse(res, grados);
  } catch (err) {
    next(err);
  }
};