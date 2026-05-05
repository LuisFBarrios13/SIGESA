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
  getTarifa,
  upsertTarifa,
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

/** GET /api/pagos/tarifas/:year */
export const getTarifaHandler = async (req, res, next) => {
  try {
    const year = Number(req.params.year);
    if (!year || year < 2000) return errorResponse(res, 'Año inválido', 400);
    const data = await getTarifa(year);
    return successResponse(res, data ?? null);
  } catch (err) { next(err); }
};

/** POST /api/pagos/tarifas  — crea o actualiza la tarifa de un año */
export const upsertTarifaHandler = async (req, res, next) => {
  try {
    const { year, valor_pension, valor_matricula } = req.body;
    if (!year || valor_pension == null || valor_matricula == null) {
      return errorResponse(res, 'year, valor_pension y valor_matricula son requeridos', 400);
    }
    if (parseFloat(valor_pension) < 0 || parseFloat(valor_matricula) < 0) {
      return errorResponse(res, 'Los valores no pueden ser negativos', 400);
    }
    const data = await upsertTarifa(Number(year), parseFloat(valor_pension), parseFloat(valor_matricula));
    return successResponse(res, data, 'Tarifa guardada correctamente');
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
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

/**
 * POST /api/pagos/cuentas/pension
 * Ya no recibe valor_pension — lo toma de la tarifa global del año.
 */
export const postGenerarPension = async (req, res, next) => {
  try {
    const { id_matricula, year } = req.body;
    if (!id_matricula || !year) {
      return errorResponse(res, 'id_matricula y year son requeridos', 400);
    }
    const data = await generarCuentasPension(Number(id_matricula), Number(year));
    return successResponse(res, data, 'Cuentas de pensión generadas', 201);
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/**
 * POST /api/pagos/cuentas/matricula
 * Ya no recibe valor — lo toma de la tarifa global del año.
 */
export const postCuentaMatricula = async (req, res, next) => {
  try {
    const { id_matricula, year } = req.body;
    if (!id_matricula || !year) {
      return errorResponse(res, 'id_matricula y year son requeridos', 400);
    }
    const data = await crearCuentaMatricula(Number(id_matricula), Number(year));
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