// src/matriculas/matricula.routes.js
import { Router } from 'express';
import { crear, listar } from './matricula.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Only ADMINISTRADOR can create or list enrollments
router.post('/', authenticate, authorize(ROLES.ADMINISTRADOR), crear);
router.get('/', authenticate, authorize(ROLES.ADMINISTRADOR), listar);

export default router;