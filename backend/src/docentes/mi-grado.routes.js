// src/docentes/mi-grado.routes.js
// Routes under /api/docente (singular) — docente's own data.
// Separate from /api/docentes (plural) which is admin-only.

import { Router }                    from 'express';
import { getPerfil, getEstudiantes } from './mi-grado.controller.js';
import { authenticate, authorize }   from '../middlewares/auth.middleware.js';
import { ROLES }                     from '../constants/roles.js';
import { validar, v }                from '../middlewares/validar.middleware.js';

const router = Router();

router.get('/perfil',      authenticate, authorize(ROLES.DOCENTE), getPerfil);
router.get('/estudiantes', authenticate, authorize(ROLES.DOCENTE),
  validar([v.year('year', 'query', { opcional: true })]), getEstudiantes);

export default router;