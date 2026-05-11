// src/materias/materia.routes.js
import { Router }                  from 'express';
import { listar, crear }           from './materia.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES }                   from '../constants/roles.js';

const router = Router();

router.get('/',  authenticate, authorize(ROLES.DOCENTE, ROLES.ADMINISTRADOR), listar);
router.post('/', authenticate, authorize(ROLES.ADMINISTRADOR), crear);

export default router;