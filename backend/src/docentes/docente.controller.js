// src/docentes/docente.controller.js
import {
  registrarDocente,
  listarDocentes,
  listarDisponibilidadGrados,
  actualizarDocente,
} from './docente.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/** POST /api/docentes */
export const crear = async (req, res) => {
  const { cedula, nombre, telefono, correo, jornada, nombreGrado } = req.body;

  if (!cedula?.trim())      return errorResponse(res, 'La cédula es requerida', 400);
  if (!nombre?.trim())      return errorResponse(res, 'El nombre es requerido', 400);
  if (!jornada)             return errorResponse(res, 'La jornada es requerida', 400);
  if (!['MAÑANA', 'TARDE', 'COMPLETA'].includes(jornada))
    return errorResponse(res, 'La jornada debe ser MAÑANA, TARDE o COMPLETA', 400);
  if (!nombreGrado?.trim()) return errorResponse(res, 'El nombre del grado es requerido', 400);

  const result = await registrarDocente({
    cedula:      cedula.trim(),
    nombre:      nombre.trim(),
    telefono:    telefono?.trim() || undefined,
    correo:      correo?.trim()   || undefined,
    jornada,
    nombreGrado: nombreGrado.trim(),
  });
  return successResponse(res, result, 'Docente registrado exitosamente', 201);
};

/** GET /api/docentes */
export const listar = async (req, res) => {
  const docentes = await listarDocentes();
  return successResponse(res, docentes);
};

/** GET /api/docentes/disponibilidad */
export const disponibilidad = async (req, res) => {
  const grados = await listarDisponibilidadGrados();
  return successResponse(res, grados);
};

/** PATCH /api/docentes/:cedula */
export const actualizar = async (req, res) => {
  const { cedula } = req.params;
  const data = await actualizarDocente(cedula, req.body);
  return successResponse(res, data, 'Docente actualizado correctamente');
};