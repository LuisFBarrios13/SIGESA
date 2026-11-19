// src/docentes/docente.controller.js
import {
  registrarDocente,
  listarDocentes,
  listarDisponibilidadGrados,
  actualizarDocente,
  cambiarAsignacion,
  intercambiarAsignacion,
} from './docente.service.js';
import { successResponse } from '../utils/responseHandler.js';

/** POST /api/docentes */
export const crear = async (req, res) => {
  // Los datos ya vienen validados por la ruta (docente.routes.js).
  const { cedula, nombre, telefono, correo, jornada, nombreGrado } = req.body;

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

/** PUT /api/docentes/:cedula/asignacion — mover a un grado libre */
export const asignacion = async (req, res) => {
  const data = await cambiarAsignacion(req.params.cedula, {
    jornada:     req.body.jornada,
    nombreGrado: req.body.nombreGrado.trim(),
  });
  return successResponse(res, data, 'Grado y jornada actualizados');
};

/** POST /api/docentes/:cedula/intercambio — intercambiar grado y jornada con otro docente */
export const intercambio = async (req, res) => {
  const data = await intercambiarAsignacion(req.params.cedula, req.body.con.trim());
  return successResponse(res, data, 'Docentes intercambiados');
};