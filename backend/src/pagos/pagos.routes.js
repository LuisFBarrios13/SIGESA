// src/pagos/pagos.routes.js
import { Router } from 'express';
import { query } from 'express-validator';
import {
  getConceptos,
  getMetodos,
  buscarMatriculasHandler,
  getResumenPagos,
  postGenerarPension,
  postCuentaMatricula,
  postPago,
  getAllCuentas,
  getTarifaHandler,
  upsertTarifaHandler,
} from './pagos.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';

const router = Router();

// All pagos routes require ADMINISTRADOR
router.use(authenticate, authorize(ROLES.ADMINISTRADOR));

// Tarifas globales
router.get('/tarifas/:year', validar([v.year('year', 'param')]), getTarifaHandler);
router.post('/tarifas', validar([
  v.year(),
  v.dinero('valor_pension', 'El valor de la pensión'),
  v.dinero('valor_matricula', 'El valor de la matrícula'),
]), upsertTarifaHandler);

// Reference data
router.get('/conceptos',              getConceptos);
router.get('/metodos',                getMetodos);

// Búsqueda de matrículas
router.get('/matriculas/buscar', validar([
  v.texto('q', 'El texto de búsqueda', 100, 'query'),
  v.year('year', 'query', { opcional: true }),
]), buscarMatriculasHandler);
router.get('/matriculas/:id_matricula', validar([v.id('id_matricula', 'param')]), getResumenPagos);

// Generación de cuentas (usan tarifa global)
const reglasCuenta = validar([v.id('id_matricula'), v.year()]);
router.post('/cuentas/pension',   reglasCuenta, postGenerarPension);
router.post('/cuentas/matricula', reglasCuenta, postCuentaMatricula);

// Registro de pagos + listado general
router.post('/', validar([
  v.id('id_cuenta'),
  v.dinero('monto_pago', 'El monto', { positivo: true }),
  v.id('id_metodo_pago'),
  v.fecha('fecha_pago', 'La fecha de pago', { opcional: true }),
  v.textoOpcional('observaciones', 'Las observaciones', 500),
]), postPago);
router.get('/', validar([
  v.year('year', 'query', { opcional: true }),
  v.enLista('estado', ['PENDIENTE','PAGADO','VENCIDO'], 'El estado', { opcional: true, de: 'query' }),
  query('search').optional().isString().isLength({ max: 100 }).withMessage('La búsqueda admite máximo 100 caracteres'),
]), getAllCuentas);

export default router;