// src/materias/materia.service.js
import { Materia } from '../models/index.js';

export const listarMaterias = () =>
  Materia.findAll({ order: [['nombre', 'ASC']] });

export const crearMateria = async (nombre) => {
  if (!nombre?.trim()) throw { status: 400, message: 'El nombre de la materia es requerido' };

  const existe = await Materia.findOne({ where: { nombre: nombre.trim() } });
  if (existe) throw { status: 409, message: `Ya existe la materia "${nombre.trim()}"` };

  return Materia.create({ nombre: nombre.trim() });
};