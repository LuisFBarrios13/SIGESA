// src/pagos/pagos.routes.js
import { Router } from 'express';
import {
  getConceptos,
  getMetodos,
  buscarMatriculasHandler,
  getResumenPagos,
  postGenerarPension,
  postCuentaMatricula,
  postPago,
  getAllCuentas,
} from './pagos.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// All pagos routes require ADMINISTRADOR
router.use(authenticate, authorize(ROLES.ADMINISTRADOR));

// Reference data
router.get('/conceptos',              getConceptos);
router.get('/metodos',                getMetodos);

// Búsqueda de matrículas
router.get('/matriculas/buscar',      buscarMatriculasHandler);
router.get('/matriculas/:id_matricula', getResumenPagos);

// Generación de cuentas
router.post('/cuentas/pension',       postGenerarPension);
router.post('/cuentas/matricula',     postCuentaMatricula);

// Registro de pagos + listado general
router.post('/',                      postPago);
router.get('/',                       getAllCuentas);

export default router;