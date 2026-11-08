// src/matriculas/matricula.service.js
import bcrypt from 'bcryptjs';
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
} from '../models/index.js';
import { ROLES } from '../constants/roles.js';

const SALT_ROUNDS = 10;

export const crearMatriculaConAcudiente = async (dto) => {
  const { estudiante, matricula, acudiente, relacion = {} } = dto;

  return sequelize.transaction(async (t) => {

    // ── 1. Validar que el estudiante no exista ya ─────────────────────────────
    const estudianteExistente = await Estudiante.findByPk(
      estudiante.numero_identidad, { transaction: t },
    );

    if (estudianteExistente) {
      throw {
        status: 409,
        message: `Ya existe un estudiante registrado con el número de identidad ${estudiante.numero_identidad} (${estudianteExistente.nombre}). Si deseas re-matricularlo búscalo en la sección Estudiantes.`,
      };
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

    // ── 3. Validar matrícula duplicada ────────────────────────────────────────
    const matriculaExistente = await Matricula.findOne({
      where: {
        id_estudiante: estudianteRecord.numero_identidad,
        id_grado:      matricula.id_grado,
        year:          matricula.year,
      },
      transaction: t,
    });

    if (matriculaExistente) {
      throw {
        status: 409,
        message: `El estudiante ya está matriculado en este grado para el año ${matricula.year}`,
      };
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
        throw {
          status: 409,
          message: `Ya existe un usuario con el username ${estudiante.numero_identidad}. Es posible que este estudiante ya esté registrado en el sistema.`,
        };
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