// src/pagos/pagos.controller.js
// Single Responsibility: HTTP boundary only — parse request, call service, format response.

import {
  listarConceptos,
  listarMetodos,
  buscarMatriculas,
  obtenerResumenPagos,
  generarCuentasPension,
  crearCuentaMatricula,
  registrarPago,
  listarTodasCuentas,
} from './pagos.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/** GET /api/pagos/conceptos */
export const getConceptos = async (_req, res, next) => {
  try {
    const data = await listarConceptos();
    return successResponse(res, data);
  } catch (err) { next(err); }
};

/** GET /api/pagos/metodos */
export const getMetodos = async (_req, res, next) => {
  try {
    const data = await listarMetodos();
    return successResponse(res, data);
  } catch (err) { next(err); }
};

/** GET /api/pagos/matriculas/buscar?q=&year= */
export const buscarMatriculasHandler = async (req, res, next) => {
  try {
    const { q = '', year } = req.query;
    if (!q.trim()) return errorResponse(res, 'El parámetro q es requerido', 400);
    const data = await buscarMatriculas(q.trim(), year ? Number(year) : undefined);
    return successResponse(res, data);
  } catch (err) { next(err); }
};

/** GET /api/pagos/matriculas/:id_matricula */
export const getResumenPagos = async (req, res, next) => {
  try {
    const data = await obtenerResumenPagos(Number(req.params.id_matricula));
    return successResponse(res, data);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/** POST /api/pagos/cuentas/pension */
export const postGenerarPension = async (req, res, next) => {
  try {
    const { id_matricula, valor_pension, year } = req.body;
    if (!id_matricula || !valor_pension || !year) {
      return errorResponse(res, 'id_matricula, valor_pension y year son requeridos', 400);
    }
    if (parseFloat(valor_pension) <= 0) {
      return errorResponse(res, 'El valor de la pensión debe ser mayor a 0', 400);
    }
    const data = await generarCuentasPension(
      Number(id_matricula), parseFloat(valor_pension), Number(year),
    );
    return successResponse(res, data, 'Cuentas de pensión generadas', 201);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/** POST /api/pagos/cuentas/matricula */
export const postCuentaMatricula = async (req, res, next) => {
  try {
    const { id_matricula, valor, year } = req.body;
    if (!id_matricula || !valor || !year) {
      return errorResponse(res, 'id_matricula, valor y year son requeridos', 400);
    }
    const data = await crearCuentaMatricula(
      Number(id_matricula), parseFloat(valor), Number(year),
    );
    return successResponse(res, data, 'Cuenta de matrícula creada', 201);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/** POST /api/pagos */
export const postPago = async (req, res, next) => {
  try {
    const { id_cuenta, monto_pago, id_metodo_pago, fecha_pago, observaciones } = req.body;
    if (!id_cuenta || !monto_pago || !id_metodo_pago) {
      return errorResponse(res, 'id_cuenta, monto_pago e id_metodo_pago son requeridos', 400);
    }
    const data = await registrarPago({
      id_cuenta: Number(id_cuenta),
      monto_pago: parseFloat(monto_pago),
      id_metodo_pago: Number(id_metodo_pago),
      fecha_pago: fecha_pago || undefined,
      observaciones: observaciones || undefined,
    });
    return successResponse(res, data, 'Pago registrado exitosamente', 201);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/** GET /api/pagos?year=&estado=&search= */
export const getAllCuentas = async (req, res, next) => {
  try {
    const { year, estado, search } = req.query;
    const data = await listarTodasCuentas({
      year: year ? Number(year) : undefined,
      estado: estado || undefined,
      search: search || undefined,
    });
    return successResponse(res, data);
  } catch (err) { next(err); }
};