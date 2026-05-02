// src/grados/grado.routes.js
import { Router } from 'express';
import { listarGrados } from './grado.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
 
const router = Router();
 
router.get('/', authenticate, authorize(ROLES.ADMINISTRADOR, ROLES.DOCENTE), listarGrados);
 
export default router;
 