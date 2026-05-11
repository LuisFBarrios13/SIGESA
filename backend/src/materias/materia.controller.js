// src/materias/materia.controller.js
import { listarMaterias, crearMateria } from './materia.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export const listar = async (_req, res, next) => {
  try {
    return successResponse(res, await listarMaterias());
  } catch (err) { next(err); }
};

export const crear = async (req, res, next) => {
  try {
    const { nombre } = req.body;
    const data = await crearMateria(nombre);
    return successResponse(res, data, 'Materia creada', 201);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};