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
  Docente,
  RelacionEA,
  Rol,
  Grado,
  CuentaCobro,
  Pago,
} from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import { AppError } from '../utils/AppError.js';
import { hoy, fechaISO, yearEnCurso, opcionesMatricula, estadoParaYear } from './periodo.js';

const SALT_ROUNDS = 10;

/**
 * ¿De quién es este documento, aparte de los estudiantes? Un número de documento es de una
 * sola persona: si ya es de un docente, de un acudiente o de otra cuenta, no puede ser el
 * de un estudiante nuevo. En el paso del acudiente sirve para traer los datos del docente.
 * @param {string} documento
 * @returns {Promise<null | { tipo: 'docente'|'acudiente'|'usuario', nombre: string|null, telefono?: string|null, correo?: string|null }>}
 */
export const duenoDocumento = async (documento, { transaction } = {}) => {
  const docente = await Docente.findByPk(documento, { attributes: ['nombre', 'telefono', 'correo'], transaction });
  if (docente) return { tipo: 'docente', nombre: docente.nombre, telefono: docente.telefono, correo: docente.correo };

  const acudiente = await Acudiente.findByPk(documento, { attributes: ['nombre'], transaction });
  if (acudiente) return { tipo: 'acudiente', nombre: acudiente.nombre };

  // Administradores u otras cuentas cuyo usuario es este documento
  const usuario = await Usuario.findOne({ where: { username: documento }, attributes: ['id_usuario'], transaction });
  if (usuario) return { tipo: 'usuario', nombre: null };

  return null;
};

/** Mensaje para cuando el documento de un estudiante nuevo ya es de otra persona. */
export const mensajeDocumentoOcupado = (documento, dueno) => ({
  docente:   `El documento ${documento} es del docente ${dueno.nombre}. Revisa el número del estudiante.`,
  acudiente: `El documento ${documento} es del acudiente ${dueno.nombre}. Revisa el número del estudiante.`,
  usuario:   `El documento ${documento} ya es el usuario de otra cuenta del sistema. Revisa el número del estudiante.`,
})[dueno.tipo];

export const crearMatriculaConAcudiente = async (dto) => {
  const { estudiante, matricula, acudiente, relacion = {} } = dto;
  // Solo este año (ACTIVO) o el siguiente (PROMOCION); cualquier otro año se rechaza.
  const estadoInicial = estadoParaYear(matricula.year);

  const hoyISO = fechaISO();
  if (estudiante.fecha_nacimiento > hoyISO) {
    throw new AppError(400, 'La fecha de nacimiento no puede ser futura');
  }
  // Fecha en que se hizo la matrícula: hoy por defecto; nunca futura ni de hace más de un año.
  const fechaMatricula = matricula.fecha_matricula || hoyISO;
  if (fechaMatricula > hoyISO || fechaMatricula < `${yearEnCurso() - 1}-01-01`) {
    throw new AppError(400, 'La fecha de matrícula no puede ser futura ni de hace más de un año');
  }

  // La jornada es la del grado (Primero Mañana y Primero Tarde son grados distintos).
  const grado = await Grado.findByPk(matricula.id_grado);
  if (!grado) throw new AppError(404, 'Grado no encontrado');

  return sequelize.transaction(async (t) => {

    // ── 1. Validar que el estudiante no exista ya ─────────────────────────────
    const estudianteExistente = await Estudiante.findByPk(
      estudiante.numero_identidad, { transaction: t },
    );

    if (estudianteExistente) {
      throw new AppError(409, `Ya existe un estudiante registrado con el número de identidad ${estudiante.numero_identidad} (${estudianteExistente.nombre}). Búscalo en el paso 1 de Matrícula para re-matricularlo.`);
    }

    // El documento no puede ser el de un docente, un acudiente u otra cuenta
    const dueno = await duenoDocumento(estudiante.numero_identidad, { transaction: t });
    if (dueno) throw new AppError(409, mensajeDocumentoOcupado(estudiante.numero_identidad, dueno));
    if (acudiente.cedula === estudiante.numero_identidad) {
      throw new AppError(400, 'La cédula del acudiente no puede ser el documento del estudiante.');
    }

    // ── 2. Crear el estudiante ────────────────────────────────────────────────
    const estudianteRecord = await Estudiante.create(
      {
        numero_identidad: estudiante.numero_identidad,
        nombre:           estudiante.nombre,
        fecha_nacimiento: estudiante.fecha_nacimiento,
        tipo_documento:   estudiante.tipo_documento || null,
        sexo:             estudiante.sexo || null,
        rh:               estudiante.rh ?? null,
        eps:              estudiante.eps?.trim() || null,
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
        id_grado:        grado.id_grado,
        id_estudiante:   estudianteRecord.numero_identidad,
        year:            matricula.year,
        jornada:         grado.jornada,
        fecha_matricula: fechaMatricula,
        estado:          estadoInicial,
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
 * ¿Para qué año y con qué estado se rematricularía hoy a un estudiante que ya existe?
 * • Activo en el año en curso → promoción: el año siguiente en PROMOCION (en cualquier mes).
 * • Sin matrícula en el año en curso (p. ej. en enero, si su año anterior terminó sin
 *   rematricularse) → el año en curso, ACTIVO.
 * • Retirado en el año en curso, o ya matriculado en el año destino → no se puede.
 * @returns {Promise<{ posible: true, year: number, estado: 'ACTIVO'|'PROMOCION' }
 *                 | { posible: false, motivo: string, status: number }>}
 */
export const destinoRematricula = async (id_estudiante) => {
  const estudiante = await Estudiante.findByPk(id_estudiante, { attributes: ['nombre'] });
  if (!estudiante) throw new AppError(404, 'Estudiante no encontrado');

  const yearActual = yearEnCurso();

  // Ya matriculado para el próximo año (p. ej. estudiante nuevo en PROMOCION): no hay nada más que hacer.
  const siguiente = await Matricula.findOne({ where: { id_estudiante, year: yearActual + 1 } });
  if (siguiente) {
    return {
      posible: false, status: 409,
      motivo: `${estudiante.nombre} ya tiene una matrícula en ${yearActual + 1}${siguiente.estado === 'PROMOCION' ? ' (en promoción)' : ''}.`,
    };
  }

  const actual = await Matricula.findOne({ where: { id_estudiante, year: yearActual } });
  if (actual && actual.estado === 'RETIRADO') {
    return {
      posible: false, status: 400,
      motivo: `${estudiante.nombre} está retirado en ${yearActual}. Reactívalo desde su ficha para poder promoverlo.`,
    };
  }
  const destino = actual ? { year: yearActual + 1, estado: 'PROMOCION' } : { year: yearActual, estado: 'ACTIVO' };

  const yaTiene = await Matricula.findOne({ where: { id_estudiante, year: destino.year } });
  if (yaTiene) {
    return { posible: false, status: 409, motivo: `${estudiante.nombre} ya tiene una matrícula en ${destino.year}.` };
  }
  return { posible: true, ...destino };
};

/**
 * Matricula a un estudiante que ya existe, para el año que indica destinoRematricula.
 * El acudiente sigue siendo el mismo; la jornada es la del grado elegido.
 */
export const rematricular = async ({ id_estudiante, id_grado }) => {
  const destino = await destinoRematricula(id_estudiante);
  if (!destino.posible) throw new AppError(destino.status, destino.motivo);
  const { year, estado } = destino;

  const grado = await Grado.findByPk(id_grado);
  if (!grado) throw new AppError(404, 'Grado no encontrado');

  const creada = await Matricula.create({
    id_grado,
    id_estudiante,
    year,
    jornada:         grado.jornada,
    fecha_matricula: fechaISO(),
    estado,
  });
  return Matricula.findByPk(creada.id_matricula, { include: [{ model: Grado, as: 'grado' }] });
};

/** Años en que se puede matricular hoy (este, ACTIVO; o el siguiente, PROMOCION). */
export const obtenerPeriodo = () => ({ yearEnCurso: yearEnCurso(), opciones: opcionesMatricula() });

/**
 * Retira o reactiva una matrícula.
 * • Retirar: una matrícula ACTIVO o PROMOCION. Se eliminan las cuentas de cobro de
 *   meses FUTUROS que no tengan pagos (el estudiante ya no las debe). Las del mes en
 *   curso, las vencidas y las que tienen algún pago se conservan.
 * • Reactivar: una RETIRADO de este año (vuelve a ACTIVO) o del siguiente (vuelve a
 *   PROMOCION). Un año que ya terminó no se reabre. Las pensiones que falten se
 *   vuelven a generar desde Pagos.
 * • conPromocion: al retirar la matrícula de este año, retira también la de PROMOCION del
 *   año siguiente (si se va del colegio, ya no sigue el próximo año); al reactivarla, esa
 *   promoción retirada vuelve a PROMOCION.
 * @param {'ACTIVO'|'RETIRADO'} accion  ACTIVO = reactivar
 */
export const cambiarEstadoMatricula = async (id_matricula, accion, { conPromocion = false } = {}) =>
  sequelize.transaction(async (t) => {
    const matricula = await Matricula.findByPk(id_matricula, { transaction: t });
    if (!matricula) throw new AppError(404, 'Matrícula no encontrada');

    const fecha      = hoy();
    const yearActual = fecha.getFullYear();
    const mesActual  = fecha.getMonth() + 1;

    if (matricula.estado === 'FINALIZADO' || matricula.year < yearActual) {
      throw new AppError(400, `El año ${matricula.year} ya terminó; esa matrícula no se puede cambiar`);
    }

    let estado;
    if (accion === 'RETIRADO') {
      if (matricula.estado === 'RETIRADO') throw new AppError(400, 'La matrícula ya está retirada');
      estado = 'RETIRADO';
    } else {
      if (matricula.estado !== 'RETIRADO') throw new AppError(400, 'La matrícula ya está activa');
      estado = matricula.year > yearActual ? 'PROMOCION' : 'ACTIVO';
    }

    /** Borra las cuentas futuras sin pagos de una matrícula que se retira; devuelve cuántas. */
    const quitarCuentasFuturas = async (id) => {
      const futuras = await CuentaCobro.findAll({
        where: {
          id_matricula: id,
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
      return sinPagos.length;
    };

    let cuentasEliminadas = 0;
    let promocionRetirada = null;
    if (estado === 'RETIRADO') {
      cuentasEliminadas = await quitarCuentasFuturas(matricula.id_matricula);

      if (conPromocion && matricula.year === yearActual) {
        const promocion = await Matricula.findOne({
          where: { id_estudiante: matricula.id_estudiante, year: yearActual + 1, estado: 'PROMOCION' },
          transaction: t,
        });
        if (promocion) {
          cuentasEliminadas += await quitarCuentasFuturas(promocion.id_matricula);
          await promocion.update({ estado: 'RETIRADO' }, { transaction: t });
          promocionRetirada = promocion.year;
        }
      }
    }

    // Al reactivar la de este año, vuelve también la promoción que se retiró con ella.
    let promocionReactivada = null;
    if (estado === 'ACTIVO' && conPromocion && matricula.year === yearActual) {
      const promocion = await Matricula.findOne({
        where: { id_estudiante: matricula.id_estudiante, year: yearActual + 1, estado: 'RETIRADO' },
        transaction: t,
      });
      if (promocion) {
        await promocion.update({ estado: 'PROMOCION' }, { transaction: t });
        promocionReactivada = promocion.year;
      }
    }

    await matricula.update({ estado }, { transaction: t });
    return { matricula, cuentasEliminadas, promocionRetirada, promocionReactivada };
  });
