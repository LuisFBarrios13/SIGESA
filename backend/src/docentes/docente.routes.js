// src/docentes/docente.routes.js
import { Router } from 'express';
import { crear, listar, disponibilidad, actualizar } from './docente.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.post('/',              authenticate, authorize(ROLES.ADMINISTRADOR), crear);
router.get('/',               authenticate, authorize(ROLES.ADMINISTRADOR), listar);
router.get('/disponibilidad', authenticate, authorize(ROLES.ADMINISTRADOR), disponibilidad);
router.patch('/:cedula',      authenticate, authorize(ROLES.ADMINISTRADOR), actualizar);

export default router;