// src/estudiantes/estudiante.routes.js
import { Router } from 'express';
import { listar, buscar, obtener, actualizar } from './estudiante.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';

const router = Router();

// ADMINISTRADOR y DOCENTE pueden consultar estudiantes
router.get(
  '/buscar',
  authenticate,
  authorize(ROLES.ADMINISTRADOR, ROLES.DOCENTE),
  buscar,
);

router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRADOR, ROLES.DOCENTE),
  listar,
);

router.get(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRADOR, ROLES.DOCENTE),
  validar([v.documento('id', 'El documento', 'param')]),
  obtener,
);

// Solo ADMINISTRADOR puede editar datos del estudiante
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRADOR),
  validar([
    v.documento('id', 'El documento', 'param'),
    v.texto('nombre', 'El nombre', 150).optional(),
    v.fecha('fecha_nacimiento', 'La fecha de nacimiento', { opcional: true }),
    v.textoOpcional('rh', 'El RH', 5),
    v.textoOpcional('direccion', 'La dirección', 200),
    v.textoOpcional('observaciones', 'Las observaciones', 2000),
  ]),
  actualizar,
);

export default router;