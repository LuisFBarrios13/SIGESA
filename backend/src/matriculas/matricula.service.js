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
} from '../models/index.js';
import { ROLES } from '../constants/roles.js';

const SALT_ROUNDS = 10;

/**
 * DTO shape expected by crearMatriculaConAcudiente:
 * {
 *   estudiante: { numero_identidad, nombre, fecha_nacimiento, rh?, direccion?, observaciones? },
 *   matricula:  { id_grado, year, fecha_matricula? },
 *   acudiente:  { cedula, nombre, telefono?, correo?, direccion?, telefono_trabajo?, direccion_trabajo? },
 *   relacion:   { parentesco? }
 * }
 *
 * Transactional: all-or-nothing (Liskov / Dependency Inversion — depends on Sequelize abstraction).
 */
export const crearMatriculaConAcudiente = async (dto) => {
  const { estudiante, matricula, acudiente, relacion = {} } = dto;

  return sequelize.transaction(async (t) => {
    // ── 1. Create or find Estudiante ──────────────────────────
    const [estudianteRecord, estudianteCreado] = await Estudiante.findOrCreate({
      where: { numero_identidad: estudiante.numero_identidad },
      defaults: {
        nombre: estudiante.nombre,
        fecha_nacimiento: estudiante.fecha_nacimiento,
        rh: estudiante.rh ?? null,
        direccion: estudiante.direccion ?? null,
        observaciones: estudiante.observaciones ?? null,
      },
      transaction: t,
    });

    // ── 2. Check for duplicate enrollment same year ───────────
    const matriculaExistente = await Matricula.findOne({
      where: {
        id_estudiante: estudianteRecord.numero_identidad,
        id_grado: matricula.id_grado,
        year: matricula.year,
      },
      transaction: t,
    });

    if (matriculaExistente) {
      throw {
        status: 409,
        message: `El estudiante ya está matriculado en este grado para el año ${matricula.year}`,
      };
    }

    // ── 3. Create Matricula ───────────────────────────────────
    const matriculaRecord = await Matricula.create(
      {
        id_grado: matricula.id_grado,
        id_estudiante: estudianteRecord.numero_identidad,
        year: matricula.year,
        fecha_matricula: matricula.fecha_matricula ?? new Date(),
        estado: 'ACTIVO',
      },
      { transaction: t }
    );

    // ── 4. Create Usuario for Acudiente ───────────────────────
    //    Username = numero_identidad, password = numero_identidad (hashed)
    //    primer_login = true → frontend forces password change
    const passwordHash = await bcrypt.hash(estudiante.numero_identidad, SALT_ROUNDS);

    // If user with this username already exists, skip creation and reuse
    let usuarioAcudiente = await Usuario.findOne({
      where: { username: estudiante.numero_identidad },
      transaction: t,
    });

    if (!usuarioAcudiente) {
      usuarioAcudiente = await Usuario.create(
        {
          username: estudiante.numero_identidad,
          password: passwordHash,
          estado: true,
          primer_login: true,
        },
        { transaction: t }
      );

      // Assign ACUDIENTE role
      const rolAcudiente = await Rol.findOne({
        where: { nombre: ROLES.ACUDIENTE },
        transaction: t,
      });

      if (!rolAcudiente) {
        throw new Error('Rol ACUDIENTE no encontrado. Ejecuta los seeders primero.');
      }

      await UsuarioRol.create(
        { id_usuario: usuarioAcudiente.id_usuario, id_rol: rolAcudiente.id_rol },
        { transaction: t }
      );
    }

    // ── 5. Create or find Acudiente profile ───────────────────
    const [acudienteRecord] = await Acudiente.findOrCreate({
      where: { cedula: acudiente.cedula },
      defaults: {
        nombre: acudiente.nombre,
        telefono: acudiente.telefono ?? null,
        correo: acudiente.correo ?? null,
        direccion: acudiente.direccion ?? null,
        telefono_trabajo: acudiente.telefono_trabajo ?? null,
        direccion_trabajo: acudiente.direccion_trabajo ?? null,
        id_usuario: usuarioAcudiente.id_usuario,
      },
      transaction: t,
    });

    // ── 6. Create Relacion Estudiante-Acudiente ───────────────
    const [, relacionCreada] = await RelacionEA.findOrCreate({
      where: {
        id_estudiante: estudianteRecord.numero_identidad,
        id_acudiente: acudienteRecord.cedula,
      },
      defaults: {
        parentesco: relacion.parentesco ?? null,
        acudiente_principal: true,
      },
      transaction: t,
    });

    return {
      matricula: matriculaRecord.toJSON(),
      estudiante: estudianteRecord.toJSON(),
      acudiente: acudienteRecord.toJSON(),
      estudianteCreado,
      relacionCreada,
      credenciales: {
        username: estudiante.numero_identidad,
        passwordTemporal: estudiante.numero_identidad,
        nota: 'El acudiente debe cambiar su contraseña en el primer acceso',
      },
    };
  });
};

/**
 * Lists all enrollments with student info.
 */
export const listarMatriculas = async () =>
  Matricula.findAll({
    include: [{ model: Estudiante, as: 'estudiante' }],
    order: [['id_matricula', 'DESC']],
  });