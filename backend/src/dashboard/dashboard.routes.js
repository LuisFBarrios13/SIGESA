// src/dashboard/dashboard.routes.js
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';
import { successResponse } from '../utils/responseHandler.js';
import { obtenerMetricas } from './dashboard.service.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMINISTRADOR));

/** GET /api/dashboard?year=2026 */
router.get('/', validar([v.year('year', 'query', { opcional: true })]), async (req, res) => {
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  // Express 5 pasa al errorHandler cualquier error de una función async.
  return successResponse(res, await obtenerMetricas(year));
});

export default router;
