// src/acudientes/acudiente.routes.js
import { Router } from 'express';
import { actualizar, buscarPorCedula } from './acudiente.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Buscar acudiente por cédula (para auto-completar en formulario de matrícula)
router.get('/:cedula', authenticate, authorize(ROLES.ADMINISTRADOR), buscarPorCedula);

// Solo el ADMINISTRADOR puede modificar datos de acudientes
router.patch('/:cedula', authenticate, authorize(ROLES.ADMINISTRADOR), actualizar);

export default router;