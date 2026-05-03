// src/docentes/docente.service.js
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { Docente, Usuario, UsuarioRol, Rol, Grado } from '../models/index.js';
import { ROLES } from '../constants/roles.js';

const SALT_ROUNDS = 10;

/**
 * Reglas de negocio para asignación de jornada/grado:
 *
 * La tabla `grados` tiene filas separadas por nombre + jornada:
 *   { nombre: 'Primero', jornada: 'MAÑANA', id_grado: 1 }
 *   { nombre: 'Primero', jornada: 'TARDE',  id_grado: 2 }
 *
 * Docente COMPLETA → se asigna a AMBAS filas del grado.
 * Docente MAÑANA   → solo a la fila MAÑANA, pero falla si TARDE ya tiene
 *                    un docente COMPLETA (y viceversa).
 */

const resolverGradosAfectados = async (nombreGrado, jornadaDocente, t) => {
  if (jornadaDocente === 'COMPLETA') {
    const filas = await Grado.findAll({ where: { nombre: nombreGrado }, transaction: t });
    if (filas.length < 2) {
      throw {
        status: 404,
        message: `No se encontraron las dos jornadas del grado "${nombreGrado}". Ejecuta el seed de grados primero.`,
      };
    }
    return filas;
  }

  const fila = await Grado.findOne({
    where: { nombre: nombreGrado, jornada: jornadaDocente },
    transaction: t,
  });
  if (!fila) {
    throw {
      status: 404,
      message: `No existe el grado "${nombreGrado}" en jornada ${jornadaDocente}.`,
    };
  }
  return [fila];
};

const verificarDisponibilidad = async (gradosAfectados, nombreGrado, jornadaDocente, t) => {
  for (const grado of gradosAfectados) {
    if (grado.id_docente) {
      const ocupante = await Docente.findByPk(grado.id_docente, { transaction: t });
      throw {
        status: 409,
        message: `El grado "${nombreGrado}" en jornada ${grado.jornada} ya está asignado a ${ocupante?.nombre ?? 'otro docente'}.`,
      };
    }
  }

  if (jornadaDocente !== 'COMPLETA') {
    const jornadaOpuesta = jornadaDocente === 'MAÑANA' ? 'TARDE' : 'MAÑANA';
    const filaOpuesta = await Grado.findOne({
      where: { nombre: nombreGrado, jornada: jornadaOpuesta },
      transaction: t,
    });
    if (filaOpuesta?.id_docente) {
      const docenteOpuesto = await Docente.findByPk(filaOpuesta.id_docente, { transaction: t });
      if (docenteOpuesto?.jornada === 'COMPLETA') {
        throw {
          status: 409,
          message: `El grado "${nombreGrado}" está cubierto en jornada completa por ${docenteOpuesto.nombre}. No se puede asignar otro docente.`,
        };
      }
    }
  }
};

export const registrarDocente = async (dto) => {
  const { cedula, nombre, telefono, correo, jornada, nombreGrado } = dto;

  return sequelize.transaction(async (t) => {
    const existente = await Docente.findByPk(cedula, { transaction: t });
    if (existente) {
      throw { status: 409, message: `Ya existe un docente con cédula ${cedula}.` };
    }

    const gradosAfectados = await resolverGradosAfectados(nombreGrado, jornada, t);
    await verificarDisponibilidad(gradosAfectados, nombreGrado, jornada, t);

    let usuario = await Usuario.findOne({ where: { username: cedula }, transaction: t });

    if (!usuario) {
      const passwordHash = await bcrypt.hash(cedula, SALT_ROUNDS);
      usuario = await Usuario.create(
        { username: cedula, password: passwordHash, estado: true, primer_login: true },
        { transaction: t }
      );

      const rolDocente = await Rol.findOne({ where: { nombre: ROLES.DOCENTE }, transaction: t });
      if (!rolDocente) throw new Error('Rol DOCENTE no encontrado. Ejecuta los seeders primero.');

      await UsuarioRol.create(
        { id_usuario: usuario.id_usuario, id_rol: rolDocente.id_rol },
        { transaction: t }
      );
    }

    const docente = await Docente.create(
      { cedula, nombre, telefono: telefono ?? null, correo: correo ?? null, jornada, id_usuario: usuario.id_usuario },
      { transaction: t }
    );

    for (const grado of gradosAfectados) {
      await grado.update({ id_docente: cedula }, { transaction: t });
    }

    return {
      docente: docente.toJSON(),
      gradosAsignados: gradosAfectados.map((g) => ({
        id_grado: g.id_grado,
        nombre: g.nombre,
        jornada: g.jornada,
      })),
      credenciales: {
        username: cedula,
        passwordTemporal: cedula,
        nota: 'El docente debe cambiar su contraseña en el primer acceso al sistema.',
      },
    };
  });
};

export const listarDocentes = async () =>
  Docente.findAll({
    include: [{ model: Grado, as: 'grados', attributes: ['id_grado', 'nombre', 'jornada'] }],
    order: [['nombre', 'ASC']],
  });

export const listarDisponibilidadGrados = async () =>
  Grado.findAll({
    include: [{ model: Docente, as: 'docente', attributes: ['cedula', 'nombre', 'jornada'] }],
    order: [['nombre', 'ASC'], ['jornada', 'ASC']],
  });