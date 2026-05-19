// src/acudientes/acudiente.routes.js
import { Router } from 'express';
import { actualizar } from './acudiente.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Solo el ADMINISTRADOR puede modificar datos de acudientes
router.patch('/:cedula', authenticate, authorize(ROLES.ADMINISTRADOR), actualizar);

export default router;