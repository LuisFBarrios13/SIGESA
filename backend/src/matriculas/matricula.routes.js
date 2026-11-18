// src/matriculas/matricula.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { crear, listar, rematricula, cambiarEstado, documento, periodo, destino } from './matricula.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';
import { TIPOS_DOCUMENTO, SEXOS, TIPOS_SANGRE } from '../constants/estudiantes.js';

const router = Router();

// Only ADMINISTRADOR can create or list enrollments
router.post('/', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.documento('estudiante.numero_identidad', 'El documento del estudiante'),
  v.texto('estudiante.nombre', 'El nombre del estudiante', 150),
  v.fecha('estudiante.fecha_nacimiento', 'La fecha de nacimiento'),
  v.enLista('estudiante.tipo_documento', TIPOS_DOCUMENTO, 'El tipo de documento', { opcional: true }),
  v.enLista('estudiante.sexo', SEXOS, 'El sexo', { opcional: true }),
  v.enLista('estudiante.rh', TIPOS_SANGRE, 'El tipo de sangre', { opcional: true }),
  v.textoOpcional('estudiante.eps', 'La EPS', 100),
  v.textoOpcional('estudiante.direccion', 'La dirección', 200),
  v.textoOpcional('estudiante.observaciones', 'Las observaciones', 2000),
  v.id('matricula.id_grado'),
  v.year('matricula.year'),
  v.enLista('matricula.jornada', ['MAÑANA', 'TARDE'], 'La jornada', { opcional: true }), // se ignora: manda el grado
  v.documento('acudiente.cedula', 'La cédula del acudiente'),
  v.texto('acudiente.nombre', 'El nombre del acudiente', 150),
  v.textoOpcional('acudiente.telefono', 'El teléfono', 20),
  v.textoOpcional('acudiente.direccion', 'La dirección', 200),
  v.textoOpcional('acudiente.telefono_trabajo', 'El teléfono del trabajo', 20),
  v.textoOpcional('acudiente.direccion_trabajo', 'La dirección del trabajo', 200),
  v.fecha('matricula.fecha_matricula', 'La fecha de matrícula', { opcional: true }),
  v.correo('acudiente.correo'),
  v.textoOpcional('relacion.parentesco', 'El parentesco', 50),
]), crear);
router.get('/', authenticate, authorize(ROLES.ADMINISTRADOR), listar);

// Años en que se puede matricular hoy: el año en curso o el siguiente (en promoción)
router.get('/periodo', authenticate, authorize(ROLES.ADMINISTRADOR), periodo);

// ¿De quién es un documento? (para no registrar a un estudiante con el número de un docente)
router.get('/documento/:documento', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.documento('documento', 'El documento', 'param'),
]), documento);

// Para qué año se rematricularía a un estudiante (activo este año → el siguiente, en promoción)
router.get('/rematricula/:id_estudiante', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.documento('id_estudiante', 'El documento del estudiante', 'param'),
]), destino);

// Matricular a un estudiante que ya existe (año según destinoRematricula)
router.post('/rematricula', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.documento('id_estudiante', 'El documento del estudiante'),
  v.id('id_grado'),
]), rematricula);

// Retirar o reactivar una matrícula
router.patch('/:id_matricula/estado', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.id('id_matricula', 'param'),
  v.enLista('estado', ['ACTIVO', 'RETIRADO'], 'El estado'),
  body('conPromocion').optional().isBoolean({ strict: true }).withMessage('conPromocion debe ser true o false'),
]), cambiarEstado);

export default router;