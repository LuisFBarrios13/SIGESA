// src/dashboard/dashboard.routes.js
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import { obtenerMetricas } from './dashboard.service.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMINISTRADOR));

/** GET /api/dashboard?year=2026 */
router.get('/', async (req, res) => {
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return errorResponse(res, 'Año inválido', 400);
  }
  // Express 5 pasa al errorHandler cualquier error de una función async.
  return successResponse(res, await obtenerMetricas(year));
});

export default router;
