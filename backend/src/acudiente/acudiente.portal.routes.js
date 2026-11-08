import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { misEstudiantes, resumenPagos } from './acudiente.portal.controller.js';

const router = Router();

router.get('/mis-estudiantes', authenticate, misEstudiantes);
router.get('/pagos/:id_matricula', authenticate, resumenPagos);

export default router;
