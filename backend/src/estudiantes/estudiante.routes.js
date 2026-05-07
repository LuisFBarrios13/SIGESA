// src/estudiantes/estudiante.routes.js
import { Router } from 'express';
import { listar, buscar, obtener, actualizar } from './estudiante.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// ADMINISTRADOR y DOCENTE pueden consultar estudiantes
router.get(
  '/buscar',
  authenticate,
  authorize(ROLES.ADMINISTRADOR, ROLES.DOCENTE),
  buscar,
);

router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRADOR, ROLES.DOCENTE),
  listar,
);

router.get(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRADOR, ROLES.DOCENTE),
  obtener,
);

// Solo ADMINISTRADOR puede editar datos del estudiante
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRADOR),
  actualizar,
);

export default router;