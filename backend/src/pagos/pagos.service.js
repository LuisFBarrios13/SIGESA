// src/pagos/pagos.service.js
// Single Responsibility: each function handles one domain operation.
// Open/Closed: new concepto/metodo types extend without modifying existing logic.

import { sequelize } from '../config/database.js';
import {
  CuentaCobro,
  Pago,
  ConceptoPago,
  MetodoPago,
  Matricula,
  Estudiante,
  Grado,
} from '../models/index.js';
import { Op } from 'sequelize';

// ── Constants ──────────────────────────────────────────────────

/** Meses de cobro: febrero (2) a noviembre (11) */
export const MESES_COBRO = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const NOMBRE_MES = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

// ── Seed helpers (idempotent) ──────────────────────────────────

/**
 * Ensures default ConceptoPago records exist.
 * Returns map: nombre → instancia.
 */
export const ensureConceptos = async () => {
  const CONCEPTOS = ['MATRÍCULA', 'PENSIÓN'];
  const results = {};
  for (const nombre of CONCEPTOS) {
    const [inst] = await ConceptoPago.findOrCreate({ where: { nombre } });
    results[nombre] = inst;
  }
  return results;
};

/**
 * Ensures default MetodoPago records exist.
 */
export const ensureMetodos = async () => {
  const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'CONSIGNACIÓN', 'TARJETA'];
  const results = {};
  for (const nombre of METODOS) {
    const [inst] = await MetodoPago.findOrCreate({ where: { nombre } });
    results[nombre] = inst;
  }
  return results;
};

// ── Queries ────────────────────────────────────────────────────

/** Returns all conceptos */
export const listarConceptos = () =>
  ConceptoPago.findAll({ order: [['nombre', 'ASC']] });

/** Returns all métodos de pago */
export const listarMetodos = () =>
  MetodoPago.findAll({ order: [['nombre', 'ASC']] });

/**
 * Returns all cuentas de cobro for a matricula, with pagos nested.
 */
export const listarCuentasPorMatricula = (id_matricula) =>
  CuentaCobro.findAll({
    where: { id_matricula },
    include: [
      { model: ConceptoPago, as: 'concepto' },
      {
        model: Pago,
        as: 'pagos',
        include: [{ model: MetodoPago, as: 'metodo' }],
        order: [['fecha_pago', 'DESC']],
      },
    ],
    order: [['mes', 'ASC'], ['id_cuenta', 'ASC']],
  });

/**
 * Search matriculas by student name or identity number.
 */
export const buscarMatriculas = async (query, year) => {
  const whereMatricula = { estado: 'ACTIVO' };
  if (year) whereMatricula.year = year;

  return Matricula.findAll({
    where: whereMatricula,
    include: [
      {
        model: Estudiante,
        as: 'estudiante',
        where: {
          [Op.or]: [
            { nombre: { [Op.iLike]: `%${query}%` } },
            { numero_identidad: { [Op.iLike]: `%${query}%` } },
          ],
        },
      },
      { model: Grado, as: 'grado', attributes: ['id_grado', 'nombre', 'jornada'] },
    ],
    order: [[{ model: Estudiante, as: 'estudiante' }, 'nombre', 'ASC']],
    limit: 20,
  });
};

/**
 * Returns a single matricula with full payment context.
 */
export const obtenerResumenPagos = async (id_matricula) => {
  const matricula = await Matricula.findByPk(id_matricula, {
    include: [
      { model: Estudiante, as: 'estudiante' },
      { model: Grado, as: 'grado' },
    ],
  });
  if (!matricula) throw { status: 404, message: 'Matrícula no encontrada' };

  const cuentas = await listarCuentasPorMatricula(id_matricula);

  // Aggregate totals
  const totales = cuentas.reduce(
    (acc, c) => {
      const totalPagado = (c.pagos ?? []).reduce(
        (s, p) => s + parseFloat(p.monto_pago), 0,
      );
      acc.deuda     += parseFloat(c.valor_deuda);
      acc.pagado    += totalPagado;
      acc.pendiente += Math.max(0, parseFloat(c.valor_deuda) - totalPagado);
      return acc;
    },
    { deuda: 0, pagado: 0, pendiente: 0 },
  );

  return { matricula, cuentas, totales };
};

// ── Commands ───────────────────────────────────────────────────

/**
 * Generates monthly "pensión" cuentas de cobro for a matricula.
 * Idempotent: skips months that already have a cuenta.
 *
 * @param {number} id_matricula
 * @param {number} valor_pension - monthly fee amount
 * @param {number} year
 */
export const generarCuentasPension = async (id_matricula, valor_pension, year) => {
  const matricula = await Matricula.findByPk(id_matricula);
  if (!matricula) throw { status: 404, message: 'Matrícula no encontrada' };

  const conceptos = await ensureConceptos();
  const conceptoPension = conceptos['PENSIÓN'];

  return sequelize.transaction(async (t) => {
    const creadas = [];
    for (const mes of MESES_COBRO) {
      const [cuenta, isNew] = await CuentaCobro.findOrCreate({
        where: { id_matricula, id_concepto_pago: conceptoPension.id_concepto_pago, mes, year },
        defaults: {
          valor_deuda: valor_pension,
          estado: 'PENDIENTE',
        },
        transaction: t,
      });
      if (isNew) creadas.push(cuenta);
    }
    return { creadas, total: MESES_COBRO.length };
  });
};

/**
 * Creates a single "matrícula" cuenta de cobro.
 * Fails if one already exists for this matricula/year.
 *
 * @param {number} id_matricula
 * @param {number} valor
 * @param {number} year
 */
export const crearCuentaMatricula = async (id_matricula, valor, year) => {
  const matricula = await Matricula.findByPk(id_matricula);
  if (!matricula) throw { status: 404, message: 'Matrícula no encontrada' };

  const conceptos = await ensureConceptos();
  const conceptoMatricula = conceptos['MATRÍCULA'];

  const existente = await CuentaCobro.findOne({
    where: {
      id_matricula,
      id_concepto_pago: conceptoMatricula.id_concepto_pago,
      year,
    },
  });
  if (existente) {
    throw { status: 409, message: `Ya existe una cuenta de matrícula para el año ${year}` };
  }

  return CuentaCobro.create({
    id_matricula,
    id_concepto_pago: conceptoMatricula.id_concepto_pago,
    mes: 1, // La matrícula se registra en enero (mes 1)
    year,
    valor_deuda: valor,
    estado: 'PENDIENTE',
  });
};

/**
 * Registers a payment against a cuenta de cobro.
 * Updates cuenta estado automatically.
 *
 * @param {object} dto - { id_cuenta, monto_pago, id_metodo_pago, fecha_pago?, observaciones? }
 */
export const registrarPago = async (dto) => {
  const { id_cuenta, monto_pago, id_metodo_pago, fecha_pago, observaciones } = dto;

  return sequelize.transaction(async (t) => {
    const cuenta = await CuentaCobro.findByPk(id_cuenta, {
      transaction: t,
      lock: t.LOCK.UPDATE,
      of: CuentaCobro,
    });
    if (!cuenta) throw { status: 404, message: 'Cuenta de cobro no encontrada' };

    const pagos = await Pago.findAll({ where: { id_cuenta_cobro: id_cuenta }, transaction: t });
    const metodo = await MetodoPago.findByPk(id_metodo_pago, { transaction: t });
    if (!metodo) throw { status: 404, message: 'Método de pago no válido' };

    // Validate amount
    const totalYaPagado = pagos.reduce(
      (s, p) => s + parseFloat(p.monto_pago), 0,
    );
    const saldo = parseFloat(cuenta.valor_deuda) - totalYaPagado;

    if (parseFloat(monto_pago) <= 0) {
      throw { status: 400, message: 'El monto debe ser mayor a 0' };
    }
    if (parseFloat(monto_pago) > saldo + 0.01) {
      throw {
        status: 400,
        message: `El monto ($${monto_pago}) supera el saldo pendiente ($${saldo.toFixed(2)})`,
      };
    }

    const pago = await Pago.create(
      {
        id_cuenta_cobro: id_cuenta,
        monto_pago: parseFloat(monto_pago),
        id_metodo_pago,
        fecha_pago: fecha_pago ?? new Date(),
        observaciones: observaciones ?? null,
      },
      { transaction: t },
    );

    // Recalculate estado
    const nuevoTotal = totalYaPagado + parseFloat(monto_pago);
    let nuevoEstado = 'PENDIENTE';
    if (nuevoTotal >= parseFloat(cuenta.valor_deuda) - 0.01) nuevoEstado = 'PAGADO';

    await cuenta.update({ estado: nuevoEstado }, { transaction: t });

    return { pago, estado: nuevoEstado, saldoRestante: Math.max(0, saldo - parseFloat(monto_pago)) };
  });
};

/**
 * Returns all cuentas paginated/filterable for the admin view.
 */
export const listarTodasCuentas = async ({ year, estado, search } = {}) => {
  const whereMatricula = {};
  if (year) whereMatricula.year = year;

  const whereCuenta = {};
  if (estado) whereCuenta.estado = estado;

  const whereEstudiante = search
    ? {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { numero_identidad: { [Op.iLike]: `%${search}%` } },
        ],
      }
    : {};

  return CuentaCobro.findAll({
    where: whereCuenta,
    include: [
      {
        model: Matricula,
        as: 'matricula',
        where: whereMatricula,
        required: true,
        include: [
          { model: Estudiante, as: 'estudiante', where: whereEstudiante, required: !!search },
          { model: Grado, as: 'grado', attributes: ['nombre', 'jornada'] },
        ],
      },
      { model: ConceptoPago, as: 'concepto' },
      {
        model: Pago,
        as: 'pagos',
        include: [{ model: MetodoPago, as: 'metodo' }],
      },
    ],
    order: [['year', 'DESC'], ['mes', 'ASC']],
    limit: 100,
  });
};