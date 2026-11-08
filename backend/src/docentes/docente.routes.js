// src/docentes/docente.routes.js
import { Router } from 'express';
import { crear, listar, disponibilidad, actualizar } from './docente.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';

const router = Router();

router.post('/', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.documento('cedula', 'La cédula'),
  v.texto('nombre', 'El nombre', 150),
  v.textoOpcional('telefono', 'El teléfono', 20),
  v.correo('correo'),
  v.enLista('jornada', ['MAÑANA', 'TARDE', 'COMPLETA'], 'La jornada'),
  v.texto('nombreGrado', 'El grado', 100),
]), crear);
router.get('/',               authenticate, authorize(ROLES.ADMINISTRADOR), listar);
router.get('/disponibilidad', authenticate, authorize(ROLES.ADMINISTRADOR), disponibilidad);
router.patch('/:cedula', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.documento('cedula', 'La cédula', 'param'),
  v.texto('nombre', 'El nombre', 150),
  v.textoOpcional('telefono', 'El teléfono', 20),
  v.correo('correo'),
]), actualizar);

export default router;