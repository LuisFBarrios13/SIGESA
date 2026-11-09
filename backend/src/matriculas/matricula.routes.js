// src/matriculas/matricula.routes.js
import { Router } from 'express';
import { crear, listar, rematricula, cambiarEstado } from './matricula.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validar, v } from '../middlewares/validar.middleware.js';

const router = Router();

// Only ADMINISTRADOR can create or list enrollments
router.post('/', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.documento('estudiante.numero_identidad', 'El documento del estudiante'),
  v.texto('estudiante.nombre', 'El nombre del estudiante', 150),
  v.fecha('estudiante.fecha_nacimiento', 'La fecha de nacimiento'),
  v.textoOpcional('estudiante.rh', 'El RH', 5),
  v.textoOpcional('estudiante.direccion', 'La dirección', 200),
  v.textoOpcional('estudiante.observaciones', 'Las observaciones', 2000),
  v.id('matricula.id_grado'),
  v.year('matricula.year'),
  v.enLista('matricula.jornada', ['MAÑANA', 'TARDE'], 'La jornada', { opcional: true }),
  v.documento('acudiente.cedula', 'La cédula del acudiente'),
  v.texto('acudiente.nombre', 'El nombre del acudiente', 150),
  v.textoOpcional('acudiente.telefono', 'El teléfono', 20),
  v.textoOpcional('acudiente.direccion', 'La dirección', 200),
  v.correo('acudiente.correo'),
  v.textoOpcional('relacion.parentesco', 'El parentesco', 50),
]), crear);
router.get('/', authenticate, authorize(ROLES.ADMINISTRADOR), listar);

// Matricular a un estudiante que ya existe (año siguiente, cambio de grado…)
router.post('/rematricula', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.documento('id_estudiante', 'El documento del estudiante'),
  v.id('id_grado'),
  v.year(),
]), rematricula);

// Retirar o reactivar una matrícula
router.patch('/:id_matricula/estado', authenticate, authorize(ROLES.ADMINISTRADOR), validar([
  v.id('id_matricula', 'param'),
  v.enLista('estado', ['ACTIVO', 'RETIRADO'], 'El estado'),
]), cambiarEstado);

export default router;