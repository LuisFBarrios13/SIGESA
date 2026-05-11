// src/notas/nota.routes.js
import { Router } from 'express';
import {
  getNotas,
  guardarBulk,
  getNotasDeEstudiante,
  guardarNotasDeEstudiante,
} from './nota.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES }                   from '../constants/roles.js';

const router = Router();

const auth = [authenticate, authorize(ROLES.DOCENTE, ROLES.ADMINISTRADOR)];

// Por grado + materia (hoja de cálculo clásica — se mantiene para otros usos)
router.get('/',      ...auth, getNotas);
router.post('/bulk', ...auth, guardarBulk);

// Por estudiante (nuevo flujo principal)
router.get('/estudiante/:id_matricula',  ...auth, getNotasDeEstudiante);
router.post('/estudiante-bulk',          ...auth, guardarNotasDeEstudiante);

export default router;