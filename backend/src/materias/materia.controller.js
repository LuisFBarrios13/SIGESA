// src/materias/materia.controller.js
import { listarMaterias, crearMateria } from './materia.service.js';
import { successResponse } from '../utils/responseHandler.js';

export const listar = async (_req, res) => {
  return successResponse(res, await listarMaterias());
};

export const crear = async (req, res) => {
  const { nombre } = req.body;
  const data = await crearMateria(nombre);
  return successResponse(res, data, 'Materia creada', 201);
};