// src/portal-acudiente/acudiente.portal.routes.js
// Portal del acudiente: solo usuarios con rol ACUDIENTE.
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';
import { misEstudiantes, resumenPagos } from './acudiente.portal.controller.js';
import { requiereMatriculaVigente } from './vigencia.js';

const router = Router();

// Sin un estudiante con matrícula vigente, el acudiente no tiene nada que ver aquí.
router.use(authenticate, authorize(ROLES.ACUDIENTE), requiereMatriculaVigente);

router.get('/mis-estudiantes',     misEstudiantes);
router.get('/pagos/:id_matricula', validar([v.id('id_matricula', 'param')]), resumenPagos);

export default router;
