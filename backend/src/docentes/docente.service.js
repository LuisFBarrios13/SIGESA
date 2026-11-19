// src/docentes/docente.service.js  (agrega al archivo existente)
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { Docente, Usuario, UsuarioRol, Rol, Grado, Estudiante } from '../models/index.js';
import { ORDEN_ESCOLAR } from '../constants/grados.js';
import { ROLES } from '../constants/roles.js';
import { AppError } from '../utils/AppError.js';

const SALT_ROUNDS = 10;

// ── Lógica existente (sin cambios) ───────────────────────────────────────────

const resolverGradosAfectados = async (nombreGrado, jornadaDocente, t) => {
  if (jornadaDocente === 'COMPLETA') {
    const filas = await Grado.findAll({ where: { nombre: nombreGrado }, transaction: t });
    if (filas.length < 2) {
      throw new AppError(404, `No se encontraron las dos jornadas del grado "${nombreGrado}". Ejecuta el seed de grados primero.`);
    }
    return filas;
  }

  const fila = await Grado.findOne({
    where: { nombre: nombreGrado, jornada: jornadaDocente },
    transaction: t,
  });
  if (!fila) {
    throw new AppError(404, `No existe el grado "${nombreGrado}" en jornada ${jornadaDocente}.`);
  }
  return [fila];
};

const verificarDisponibilidad = async (gradosAfectados, nombreGrado, jornadaDocente, t) => {
  for (const grado of gradosAfectados) {
    if (grado.id_docente) {
      const ocupante = await Docente.findByPk(grado.id_docente, { transaction: t });
      throw new AppError(409, `El grado "${nombreGrado}" en jornada ${grado.jornada} ya está asignado a ${ocupante?.nombre ?? 'otro docente'}.`);
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
        throw new AppError(409, `El grado "${nombreGrado}" está cubierto en jornada completa por ${docenteOpuesto.nombre}. No se puede asignar otro docente.`);
      }
    }
  }
};

export const registrarDocente = async (dto) => {
  const { cedula, nombre, telefono, correo, jornada, nombreGrado } = dto;

  return sequelize.transaction(async (t) => {
    const existente = await Docente.findByPk(cedula, { transaction: t });
    if (existente) {
      throw new AppError(409, `Ya existe un docente con cédula ${cedula}.`);
    }

    const gradosAfectados = await resolverGradosAfectados(nombreGrado, jornada, t);
    await verificarDisponibilidad(gradosAfectados, nombreGrado, jornada, t);

    // La cédula es el usuario del docente. No puede ser el documento de un estudiante ni el
    // usuario de otra cuenta: el usuario de un acudiente es el documento de su estudiante,
    // así que reutilizarlo dejaría al docente pegado a la cuenta de ese acudiente.
    // (Un docente sí puede ser acudiente: sus cuentas tienen usuarios distintos.)
    const estudiante = await Estudiante.findByPk(cedula, { attributes: ['nombre'], transaction: t });
    if (estudiante) {
      throw new AppError(409, `La cédula ${cedula} es el documento del estudiante ${estudiante.nombre}. Revisa el número.`);
    }
    if (await Usuario.findOne({ where: { username: cedula }, attributes: ['id_usuario'], transaction: t })) {
      throw new AppError(409, `La cédula ${cedula} ya es el usuario de otra cuenta del sistema. Revisa el número.`);
    }

    const passwordHash = await bcrypt.hash(cedula, SALT_ROUNDS);
    const usuario = await Usuario.create(
      { username: cedula, password: passwordHash, estado: true, primer_login: true },
      { transaction: t }
    );

    const rolDocente = await Rol.findOne({ where: { nombre: ROLES.DOCENTE }, transaction: t });
    if (!rolDocente) throw new Error('Rol DOCENTE no encontrado. Ejecuta los seeders primero.');

    await UsuarioRol.create(
      { id_usuario: usuario.id_usuario, id_rol: rolDocente.id_rol },
      { transaction: t }
    );

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
    // Orden escolar (Pre Jardín, Jardín, Transición…), mañana antes que tarde.
    order: ORDEN_ESCOLAR,
  });

// ── Cambiar el grado y la jornada de un docente ──────────────────────────────
//
// Las notas no se tocan: cada nota pertenece a una matrícula (estudiante + grado + año),
// no al docente. Quién puede verlas y editarlas se decide al momento según el director
// actual del grado (grados.id_docente), así que al cambiar de grado el docente pasa a
// ver las notas de su grado nuevo y el nuevo director ve las que ya estaban registradas.

const CON_GRADOS = { model: Grado, as: 'grados', attributes: ['id_grado', 'nombre', 'jornada'] };

/** Mueve al docente a un grado libre (en la jornada elegida) y suelta los que tenía. */
export const cambiarAsignacion = async (cedula, { jornada, nombreGrado }) =>
  sequelize.transaction(async (t) => {
    const docente = await Docente.findByPk(cedula, { include: [CON_GRADOS], transaction: t });
    if (!docente) throw new AppError(404, 'Docente no encontrado');

    const mismo = docente.jornada === jornada && docente.grados.length > 0
      && docente.grados.every((g) => g.nombre === nombreGrado);
    if (mismo) throw new AppError(400, `${docente.nombre} ya dirige ${nombreGrado} en esa jornada.`);

    // Primero suelta los suyos: así puede quedarse en el mismo grado con otra jornada
    // (p. ej. de Primero mañana a Primero jornada completa).
    await Grado.update({ id_docente: null }, { where: { id_docente: cedula }, transaction: t });

    const gradosAfectados = await resolverGradosAfectados(nombreGrado, jornada, t);
    await verificarDisponibilidad(gradosAfectados, nombreGrado, jornada, t);
    for (const grado of gradosAfectados) {
      await grado.update({ id_docente: cedula }, { transaction: t });
    }
    await docente.update({ jornada }, { transaction: t });

    return docente.reload({ include: [CON_GRADOS], transaction: t });
  });

/**
 * Intercambia grado y jornada entre dos docentes: cada uno queda con lo que tenía el otro.
 * Sirve cuando todos los grados están ocupados. Siempre es válido porque los grupos
 * ocupados siguen siendo los mismos; solo cambian de director.
 */
export const intercambiarAsignacion = async (cedula, cedulaOtro) => {
  if (cedula === cedulaOtro) throw new AppError(400, 'Elige otro docente para intercambiar.');

  return sequelize.transaction(async (t) => {
    const a = await Docente.findByPk(cedula, { include: [CON_GRADOS], transaction: t });
    const b = await Docente.findByPk(cedulaOtro, { include: [CON_GRADOS], transaction: t });
    if (!a || !b) throw new AppError(404, 'Docente no encontrado');
    for (const d of [a, b]) {
      if (!d.grados.length) throw new AppError(409, `${d.nombre} no dirige ningún grado. Usa «Mover a un grado libre».`);
    }

    const idsA = a.grados.map((g) => g.id_grado);
    const idsB = b.grados.map((g) => g.id_grado);
    const jornadaA = a.jornada;

    await Grado.update({ id_docente: b.cedula }, { where: { id_grado: idsA }, transaction: t });
    await Grado.update({ id_docente: a.cedula }, { where: { id_grado: idsB }, transaction: t });
    await a.update({ jornada: b.jornada }, { transaction: t });
    await b.update({ jornada: jornadaA }, { transaction: t });

    await a.reload({ include: [CON_GRADOS], transaction: t });
    await b.reload({ include: [CON_GRADOS], transaction: t });
    return [a, b];
  });
};

// ── Actualizar datos personales del docente ──────────────────────────────────

/**
 * Campos editables: nombre, telefono, correo.
 * La cédula (PK) no cambia; el grado y la jornada se cambian con
 * cambiarAsignacion o intercambiarAsignacion.
 */
const CAMPOS_PERMITIDOS = ['nombre', 'telefono', 'correo'];

export const actualizarDocente = async (cedula, dto) => {
  const docente = await Docente.findByPk(cedula, {
    include: [{ model: Grado, as: 'grados', attributes: ['id_grado', 'nombre', 'jornada'] }],
  });

  if (!docente) throw new AppError(404, 'Docente no encontrado');

  const actualizaciones = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (dto[campo] !== undefined) {
      actualizaciones[campo] =
        campo === 'nombre'
          ? dto[campo].trim()
          : dto[campo]?.trim() || null;
    }
  }

  await docente.update(actualizaciones);
  return docente.reload({
    include: [{ model: Grado, as: 'grados', attributes: ['id_grado', 'nombre', 'jornada'] }],
  });
};