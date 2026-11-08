// src/materias/materia.service.js
import { Materia } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export const listarMaterias = () =>
  Materia.findAll({ order: [['nombre', 'ASC']] });

export const crearMateria = async (nombre) => {
  if (!nombre?.trim()) throw new AppError(400, 'El nombre de la materia es requerido');

  const existe = await Materia.findOne({ where: { nombre: nombre.trim() } });
  if (existe) throw new AppError(409, `Ya existe la materia "${nombre.trim()}"`);

  return Materia.create({ nombre: nombre.trim() });
};