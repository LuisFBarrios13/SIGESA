// src/pagos/pagos.controller.js
// Single Responsibility: HTTP boundary only — parse request, call service, format response.
// Los datos llegan ya validados por pagos.routes.js; aquí solo se convierten los tipos.

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
import { successResponse } from '../utils/responseHandler.js';

/** GET /api/pagos/conceptos */
export const getConceptos = async (_req, res) => {
  const data = await listarConceptos();
  return successResponse(res, data);
};

/** GET /api/pagos/metodos */
export const getMetodos = async (_req, res) => {
  const data = await listarMetodos();
  return successResponse(res, data);
};

/** GET /api/pagos/tarifas/:year */
export const getTarifaHandler = async (req, res) => {
  const year = Number(req.params.year);
  const data = await getTarifa(year);
  return successResponse(res, data ?? null);
};

/** POST /api/pagos/tarifas  — crea o actualiza la tarifa de un año */
export const upsertTarifaHandler = async (req, res) => {
  const { year, valor_pension, valor_matricula } = req.body;
  const data = await upsertTarifa(Number(year), parseFloat(valor_pension), parseFloat(valor_matricula));
  return successResponse(res, data, 'Tarifa guardada correctamente');
};

/** GET /api/pagos/matriculas/buscar?q=&year= */
export const buscarMatriculasHandler = async (req, res) => {
  // q ya viene validado; en Express 5 req.query no se puede reescribir, así que se recorta aquí.
  const { q, year } = req.query;
  const data = await buscarMatriculas(q.trim(), year ? Number(year) : undefined);
  return successResponse(res, data);
};

/** GET /api/pagos/matriculas/:id_matricula */
export const getResumenPagos = async (req, res) => {
  const data = await obtenerResumenPagos(Number(req.params.id_matricula));
  return successResponse(res, data);
};

/**
 * POST /api/pagos/cuentas/pension
 * Ya no recibe valor_pension — lo toma de la tarifa global del año.
 */
export const postGenerarPension = async (req, res) => {
  const { id_matricula, year } = req.body;
  const data = await generarCuentasPension(Number(id_matricula), Number(year));
  return successResponse(res, data, 'Cuentas de pensión generadas', 201);
};

/**
 * POST /api/pagos/cuentas/matricula
 * Ya no recibe valor — lo toma de la tarifa global del año.
 */
export const postCuentaMatricula = async (req, res) => {
  const { id_matricula, year } = req.body;
  const data = await crearCuentaMatricula(Number(id_matricula), Number(year));
  return successResponse(res, data, 'Cuenta de matrícula creada', 201);
};

/** POST /api/pagos */
export const postPago = async (req, res) => {
  const { id_cuenta, monto_pago, id_metodo_pago, fecha_pago, observaciones } = req.body;
  const data = await registrarPago({
    id_cuenta: Number(id_cuenta),
    monto_pago: parseFloat(monto_pago),
    id_metodo_pago: Number(id_metodo_pago),
    fecha_pago: fecha_pago || undefined,
    observaciones: observaciones || undefined,
  });
  return successResponse(res, data, 'Pago registrado exitosamente', 201);
};

/** GET /api/pagos?year=&estado=&search= */
export const getAllCuentas = async (req, res) => {
  const { year, estado, search } = req.query;
  const data = await listarTodasCuentas({
    year: year ? Number(year) : undefined,
    estado: estado || undefined,
    search: search || undefined,
  });
  return successResponse(res, data);
};