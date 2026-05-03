// src/docentes/docente.routes.js
import { Router } from 'express';
import { crear, listar, disponibilidad } from './docente.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Solo ADMINISTRADOR puede registrar o listar docentes
router.post('/',                authenticate, authorize(ROLES.ADMINISTRADOR), crear);
router.get('/',                 authenticate, authorize(ROLES.ADMINISTRADOR), listar);
// La disponibilidad la puede consultar el admin para renderizar el formulario
router.get('/disponibilidad',   authenticate, authorize(ROLES.ADMINISTRADOR), disponibilidad);

export default router;