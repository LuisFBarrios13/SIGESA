// src/notas/nota.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
  getNotas,
  guardarBulk,
  getNotasDeEstudiante,
  guardarNotasDeEstudiante,
} from './nota.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES }                   from '../constants/roles.js';
import { NOTA_MIN, NOTA_MAX }      from '../constants/notas.js';
import { validar, v } from '../middlewares/validar.middleware.js';

const router = Router();

const auth = [authenticate, authorize(ROLES.DOCENTE, ROLES.ADMINISTRADOR)];

/** Nota vacía ('' o null = sin nota) o número dentro de la escala. */
const nota = (campo) => body(campo).optional({ values: 'falsy' }).custom((val) => {
  const n = Number(val);
  if (Number.isNaN(n) || n < NOTA_MIN || n > NOTA_MAX) {
    throw new Error(`Las notas deben estar entre ${NOTA_MIN.toFixed(1)} y ${NOTA_MAX.toFixed(1)}`);
  }
  return true;
});
const enteroOpcional = (campo, etiqueta) => body(campo)
  .optional({ values: 'null' })
  .isInt({ min: 0, max: 999 }).withMessage(`${etiqueta} debe ser un entero mayor o igual a 0`);

// Por grado + materia (hoja de cálculo clásica — se mantiene para otros usos)
router.get('/', ...auth, validar([
  v.id('id_grado', 'query'), v.id('id_materia', 'query'),
  v.periodo('numero_periodo', 'query'), v.year('year', 'query', { opcional: true }),
]), getNotas);
router.post('/bulk', ...auth, validar([
  body('notas').isArray().withMessage('notas debe ser una lista'),
  v.id('notas.*.id_matricula'),
  nota('notas.*.nota'),
  enteroOpcional('notas.*.fallas', 'Las fallas'),
  v.id('id_materia'), v.periodo(), v.year(),
]), guardarBulk);

// Por estudiante (nuevo flujo principal)
router.get('/estudiante/:id_matricula', ...auth, validar([
  v.id('id_matricula', 'param'),
  v.periodo('numero_periodo', 'query', { opcional: true }),
  v.year('year', 'query', { opcional: true }),
]), getNotasDeEstudiante);
router.post('/estudiante-bulk', ...auth, validar([
  v.id('id_matricula'), v.periodo(), v.year(),
  body('materias').isArray().withMessage('materias debe ser una lista'),
  v.id('materias.*.id_materia'),
  nota('materias.*.nota'),
  enteroOpcional('materias.*.fallas', 'Las fallas'),
  enteroOpcional('materias.*.intensidad_horaria', 'La intensidad horaria'),
  v.textoOpcional('materias.*.observacion', 'La observación', 1000),
  body('puesto').optional({ values: 'null' }).custom((val) => {
    if (val === '' || (Number.isInteger(Number(val)) && Number(val) >= 1)) return true;
    throw new Error('El puesto debe ser un entero mayor o igual a 1');
  }),
  v.textoOpcional('observaciones', 'Las observaciones', 2000),
]), guardarNotasDeEstudiante);

export default router;