// src/portal-acudiente/acudiente.portal.routes.js
// Portal del acudiente: solo usuarios con rol ACUDIENTE.
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';
import { misEstudiantes, resumenPagos } from './acudiente.portal.controller.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ACUDIENTE));

router.get('/mis-estudiantes',     misEstudiantes);
router.get('/pagos/:id_matricula', validar([v.id('id_matricula', 'param')]), resumenPagos);

export default router;
