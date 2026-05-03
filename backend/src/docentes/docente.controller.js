// src/docentes/docente.controller.js
import {
  registrarDocente,
  listarDocentes,
  listarDisponibilidadGrados,
} from './docente.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/** POST /api/docentes */
export const crear = async (req, res, next) => {
  try {
    const { cedula, nombre, telefono, correo, jornada, nombreGrado } = req.body;

    if (!cedula?.trim())     return errorResponse(res, 'La cédula es requerida', 400);
    if (!nombre?.trim())     return errorResponse(res, 'El nombre es requerido', 400);
    if (!jornada)            return errorResponse(res, 'La jornada es requerida', 400);
    if (!['MAÑANA', 'TARDE', 'COMPLETA'].includes(jornada))
      return errorResponse(res, 'La jornada debe ser MAÑANA, TARDE o COMPLETA', 400);
    if (!nombreGrado?.trim()) return errorResponse(res, 'El nombre del grado es requerido', 400);

    const result = await registrarDocente({
      cedula: cedula.trim(),
      nombre: nombre.trim(),
      telefono: telefono?.trim() || undefined,
      correo: correo?.trim() || undefined,
      jornada,
      nombreGrado: nombreGrado.trim(),
    });
    return successResponse(res, result, 'Docente registrado exitosamente', 201);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/** GET /api/docentes */
export const listar = async (req, res, next) => {
  try {
    const docentes = await listarDocentes();
    return successResponse(res, docentes);
  } catch (err) {
    next(err);
  }
};

/** GET /api/docentes/disponibilidad — grados con estado de ocupación */
export const disponibilidad = async (req, res, next) => {
  try {
    const grados = await listarDisponibilidadGrados();
    return successResponse(res, grados);
  } catch (err) {
    next(err);
  }
};