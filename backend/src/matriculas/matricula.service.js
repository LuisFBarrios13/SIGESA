// src/matriculas/matricula.service.js
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import {
  Estudiante,
  Matricula,
  Usuario,
  UsuarioRol,
  Acudiente,
  RelacionEA,
  Rol,
  Grado,
  CuentaCobro,
  Pago,
} from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import { AppError } from '../utils/AppError.js';

const SALT_ROUNDS = 10;

export const crearMatriculaConAcudiente = async (dto) => {
  const { estudiante, matricula, acudiente, relacion = {} } = dto;

  return sequelize.transaction(async (t) => {

    // ── 1. Validar que el estudiante no exista ya ─────────────────────────────
    const estudianteExistente = await Estudiante.findByPk(
      estudiante.numero_identidad, { transaction: t },
    );

    if (estudianteExistente) {
      throw new AppError(409, `Ya existe un estudiante registrado con el número de identidad ${estudiante.numero_identidad} (${estudianteExistente.nombre}). Para matricularlo de nuevo usa el botón «Matricular» en la sección Estudiantes.`);
    }

    // ── 2. Crear el estudiante ────────────────────────────────────────────────
    const estudianteRecord = await Estudiante.create(
      {
        numero_identidad: estudiante.numero_identidad,
        nombre:           estudiante.nombre,
        fecha_nacimiento: estudiante.fecha_nacimiento,
        rh:               estudiante.rh ?? null,
        direccion:        estudiante.direccion ?? null,
        observaciones:    estudiante.observaciones ?? null,
      },
      { transaction: t },
    );

    // ── 3. Validar matrícula duplicada (una por estudiante y año) ─────────────
    const matriculaExistente = await Matricula.findOne({
      where: {
        id_estudiante: estudianteRecord.numero_identidad,
        year:          matricula.year,
      },
      transaction: t,
    });

    if (matriculaExistente) {
      throw new AppError(409, `El estudiante ya tiene una matrícula en el año ${matricula.year}`);
    }

    // ── 4. Crear la matrícula ─────────────────────────────────────────────────
    const matriculaRecord = await Matricula.create(
      {
        id_grado:        matricula.id_grado,
        id_estudiante:   estudianteRecord.numero_identidad,
        year:            matricula.year,
        jornada:         matricula.jornada,
        fecha_matricula: matricula.fecha_matricula ?? new Date(),
        estado:          'ACTIVO',
      },
      { transaction: t },
    );

    // ── 5. Acudiente: reutilizar si ya existe, crear si no ────────────────────
    let acudienteRecord = await Acudiente.findByPk(acudiente.cedula, { transaction: t });
    let acudienteNuevo = false;

    if (acudienteRecord) {
      // El acudiente ya existe — solo se vincula al nuevo estudiante
    } else {
      // Verificar que el username no esté ocupado
      const usuarioExistente = await Usuario.findOne({
        where: { username: estudiante.numero_identidad },
        transaction: t,
      });

      if (usuarioExistente) {
        throw new AppError(409, `Ya existe un usuario con el username ${estudiante.numero_identidad}. Es posible que este estudiante ya esté registrado en el sistema.`);
      }

      const passwordHash = await bcrypt.hash(estudiante.numero_identidad, SALT_ROUNDS);

      const usuarioAcudiente = await Usuario.create(
        {
          username:     estudiante.numero_identidad,
          password:     passwordHash,
          estado:       true,
          primer_login: true,
        },
        { transaction: t },
      );

      const rolAcudiente = await Rol.findOne({
        where: { nombre: ROLES.ACUDIENTE },
        transaction: t,
      });

      if (!rolAcudiente) {
        throw new Error('Rol ACUDIENTE no encontrado. Ejecuta los seeders primero.');
      }

      await UsuarioRol.create(
        { id_usuario: usuarioAcudiente.id_usuario, id_rol: rolAcudiente.id_rol },
        { transaction: t },
      );

      acudienteRecord = await Acudiente.create(
        {
          cedula:            acudiente.cedula,
          nombre:            acudiente.nombre,
          telefono:          acudiente.telefono          ?? null,
          correo:            acudiente.correo            ?? null,
          direccion:         acudiente.direccion         ?? null,
          telefono_trabajo:  acudiente.telefono_trabajo  ?? null,
          direccion_trabajo: acudiente.direccion_trabajo ?? null,
          id_usuario:        usuarioAcudiente.id_usuario,
        },
        { transaction: t },
      );

      acudienteNuevo = true;
    }

    // ── 6. Vincular estudiante con acudiente ──────────────────────────────────
    const relacionExistente = await RelacionEA.findOne({
      where: {
        id_estudiante: estudianteRecord.numero_identidad,
        id_acudiente:  acudienteRecord.cedula,
      },
      transaction: t,
    });

    if (!relacionExistente) {
      await RelacionEA.create(
        {
          id_estudiante:       estudianteRecord.numero_identidad,
          id_acudiente:        acudienteRecord.cedula,
          parentesco:          relacion.parentesco ?? null,
          acudiente_principal: true,
        },
        { transaction: t },
      );
    }

    return {
      matricula:     matriculaRecord.toJSON(),
      estudiante:    estudianteRecord.toJSON(),
      acudiente:     acudienteRecord.toJSON(),
      acudienteNuevo,
      credenciales: acudienteNuevo
        ? {
            username:         estudiante.numero_identidad,
            passwordTemporal: estudiante.numero_identidad,
            nota:             'El acudiente debe cambiar su contraseña en el primer acceso',
          }
        : {
            username:         null,
            passwordTemporal: null,
            nota:             'El acudiente ya existía en el sistema. Se vinculó al nuevo estudiante con sus credenciales actuales.',
          },
    };
  });
};

export const listarMatriculas = async () =>
  Matricula.findAll({
    include: [
      { model: Estudiante, as: 'estudiante' },
      { model: Grado,      as: 'grado' },
    ],
    order: [['id_matricula', 'DESC']],
  });

/**
 * Matricula a un estudiante que ya existe (p. ej. para el año siguiente).
 * El acudiente sigue siendo el mismo; la jornada es la del grado elegido.
 */
export const rematricular = async ({ id_estudiante, id_grado, year }) => {
  const estudiante = await Estudiante.findByPk(id_estudiante);
  if (!estudiante) throw new AppError(404, 'Estudiante no encontrado');

  const grado = await Grado.findByPk(id_grado);
  if (!grado) throw new AppError(404, 'Grado no encontrado');

  const existente = await Matricula.findOne({ where: { id_estudiante, year } });
  if (existente) throw new AppError(409, `${estudiante.nombre} ya tiene una matrícula en ${year}`);

  const creada = await Matricula.create({
    id_grado,
    id_estudiante,
    year,
    jornada:         grado.jornada,
    fecha_matricula: new Date(),
    estado:          'ACTIVO',
  });
  return Matricula.findByPk(creada.id_matricula, { include: [{ model: Grado, as: 'grado' }] });
};

/**
 * Retira o reactiva una matrícula.
 * Al retirar se eliminan las cuentas de cobro de meses FUTUROS que no tengan
 * pagos (el estudiante ya no las debe). Las del mes en curso, las vencidas y
 * las que tienen algún pago se conservan. Si se reactiva, las pensiones que
 * falten se vuelven a generar desde Pagos.
 */
export const cambiarEstadoMatricula = async (id_matricula, estado) =>
  sequelize.transaction(async (t) => {
    const matricula = await Matricula.findByPk(id_matricula, { transaction: t });
    if (!matricula) throw new AppError(404, 'Matrícula no encontrada');
    if (matricula.estado === estado) {
      throw new AppError(400, `La matrícula ya está ${estado === 'ACTIVO' ? 'activa' : 'retirada'}`);
    }

    let cuentasEliminadas = 0;
    if (estado === 'RETIRADO') {
      const hoy = new Date();
      const yearActual = hoy.getFullYear();
      const mesActual  = hoy.getMonth() + 1;
      const futuras = await CuentaCobro.findAll({
        where: {
          id_matricula,
          estado: 'PENDIENTE',
          [Op.or]: [
            { year: { [Op.gt]: yearActual } },
            { year: yearActual, mes: { [Op.gt]: mesActual } },
          ],
        },
        include: [{ model: Pago, as: 'pagos', attributes: ['id_pago'] }],
        transaction: t,
      });
      const sinPagos = futuras.filter((c) => c.pagos.length === 0).map((c) => c.id_cuenta);
      if (sinPagos.length) {
        await CuentaCobro.destroy({ where: { id_cuenta: sinPagos }, transaction: t });
      }
      cuentasEliminadas = sinPagos.length;
    }

    await matricula.update({ estado }, { transaction: t });
    return { matricula, cuentasEliminadas };
  });
