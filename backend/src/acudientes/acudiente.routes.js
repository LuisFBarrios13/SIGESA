// src/acudientes/acudiente.routes.js
import { Router } from 'express';
import { actualizar, buscarPorCedula, coincidencias } from './acudiente.controller.js';
import { restablecerClaveAcudiente } from '../usuarios/usuario.service.js';
import { successResponse } from '../utils/responseHandler.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';

const router = Router();

// Coincidencias por nombre o cédula mientras se escribe (paso 3 de la matrícula)
router.get('/', authenticate, authorize(ROLES.ADMINISTRADOR),
  validar([v.texto('q', 'El texto de búsqueda', 100, 'query')]), coincidencias);

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

// Restablece la contraseña del acudiente a su usuario (debe cambiarla al entrar)
router.post('/:cedula/restablecer-clave', authenticate, authorize(ROLES.ADMINISTRADOR),
  validar([v.documento('cedula', 'La cédula', 'param')]),
  async (req, res) => successResponse(res, await restablecerClaveAcudiente(req.params.cedula), 'Contraseña restablecida'));

export default router;