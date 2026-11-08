// src/boletin/boletin.routes.js
import { Router } from 'express';
import { getBoletin } from './boletin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';

const router = Router();

// Docente y administrador pueden ver boletines
router.get(
  '/:id_matricula',
  authenticate,
  authorize(ROLES.DOCENTE, ROLES.ADMINISTRADOR),
  validar([
    v.id('id_matricula', 'param'),
    v.periodo('periodo', 'query', { opcional: true }),
    v.year('year', 'query', { opcional: true }),
  ]),
  getBoletin,
);

export default router;