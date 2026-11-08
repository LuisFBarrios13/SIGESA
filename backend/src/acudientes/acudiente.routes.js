// src/acudientes/acudiente.routes.js
import { Router } from 'express';
import { actualizar, buscarPorCedula } from './acudiente.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';

const router = Router();

// Buscar acudiente por cédula (para auto-completar en formulario de matrícula)
router.get('/:cedula', authenticate, authorize(ROLES.ADMINISTRADOR),
  validar([v.documento('cedula', 'La cédula', 'param')]), buscarPorCedula);

// Solo el ADMINISTRADOR puede modificar datos de acudientes
router.patch('/:cedula', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.documento('cedula', 'La cédula', 'param'),
  v.texto('nombre', 'El nombre', 150),
  v.textoOpcional('telefono', 'El teléfono', 20),
  v.textoOpcional('telefono_trabajo', 'El teléfono del trabajo', 20),
  v.textoOpcional('direccion', 'La dirección', 200),
  v.textoOpcional('direccion_trabajo', 'La dirección del trabajo', 200),
  v.correo('correo'),
]), actualizar);

export default router;