// src/estudiantes/estudiante.routes.js
import { Router } from 'express';
import { listar, buscar, obtener, actualizar } from './estudiante.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';
import { TIPOS_DOCUMENTO, SEXOS, TIPOS_SANGRE } from '../constants/estudiantes.js';

const router = Router();

// ADMINISTRADOR y DOCENTE pueden consultar estudiantes
router.get(
  '/buscar',
  authenticate,
  authorize(ROLES.ADMINISTRADOR, ROLES.DOCENTE),
  validar([v.texto('q', 'El texto de búsqueda', 100, 'query')]),
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
    v.enLista('tipo_documento', TIPOS_DOCUMENTO, 'El tipo de documento', { opcional: true }),
    v.enLista('sexo', SEXOS, 'El sexo', { opcional: true }),
    v.enLista('rh', TIPOS_SANGRE, 'El tipo de sangre', { opcional: true }),
    v.textoOpcional('eps', 'La EPS', 100),
    v.textoOpcional('direccion', 'La dirección', 200),
    v.textoOpcional('observaciones', 'Las observaciones', 2000),
  ]),
  actualizar,
);

export default router;