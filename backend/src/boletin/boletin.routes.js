// src/boletin/boletin.routes.js
import { Router } from 'express';
import { getBoletin } from './boletin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Docente y administrador pueden ver boletines
router.get(
  '/:id_matricula',
  authenticate,
  authorize(ROLES.DOCENTE, ROLES.ADMINISTRADOR),
  getBoletin,
);

export default router;