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
  Tarifa,
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

export const ensureConceptos = async () => {
  const CONCEPTOS = ['MATRÍCULA', 'PENSIÓN'];
  const results = {};
  for (const nombre of CONCEPTOS) {
    const [inst] = await ConceptoPago.findOrCreate({ where: { nombre } });
    results[nombre] = inst;
  }
  return results;
};

export const ensureMetodos = async () => {
  const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'CONSIGNACIÓN', 'TARJETA'];
  const results = {};
  for (const nombre of METODOS) {
    const [inst] = await MetodoPago.findOrCreate({ where: { nombre } });
    results[nombre] = inst;
  }
  return results;
};

// ── Tarifas ────────────────────────────────────────────────────

/**
 * Returns the tarifa for a given year, or null if not configured.
 */
export const getTarifa = (year) =>
  Tarifa.findOne({ where: { year } });

/**
 * Creates or updates the global tarifa for a year.
 * Uses upsert so calling it multiple times is safe.
 */
export const upsertTarifa = async (year, valor_pension, valor_matricula) => {
  const existing = await Tarifa.findOne({ where: { year } });
  if (existing) {
    await existing.update({ valor_pension, valor_matricula });
    return existing.reload();
  }
  return Tarifa.create({ year, valor_pension, valor_matricula });
};

// ── Queries ────────────────────────────────────────────────────

export const listarConceptos = () =>
  ConceptoPago.findAll({ order: [['nombre', 'ASC']] });

export const listarMetodos = () =>
  MetodoPago.findAll({ order: [['nombre', 'ASC']] });

/**
 * Marks as VENCIDO any PENDIENTE cuenta whose month has already ended.
 *
 * A cuenta (year, mes) is overdue when today is strictly after the last
 * day of that month. May 2026 is NOT overdue on 2026-05-05 (still current);
 * April 2026 IS overdue on that same date.
 *
 * @param {number|null} id_matricula - scopes the update to one matricula
 */
export const actualizarVencidos = async (id_matricula = null) => {
  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const where = {
    estado: 'PENDIENTE',
    [Op.or]: [
      { year: { [Op.lt]: currentYear } },
      { year: currentYear, mes: { [Op.lt]: currentMonth } },
    ],
  };

  if (id_matricula) where.id_matricula = id_matricula;

  await CuentaCobro.update({ estado: 'VENCIDO' }, { where });
};

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

export const obtenerResumenPagos = async (id_matricula) => {
  // Actualiza vencidos de esta matrícula antes de devolver los datos
  await actualizarVencidos(id_matricula);

  const matricula = await Matricula.findByPk(id_matricula, {
    include: [
      { model: Estudiante, as: 'estudiante' },
      { model: Grado, as: 'grado' },
    ],
  });
  if (!matricula) throw { status: 404, message: 'Matrícula no encontrada' };

  const cuentas = await listarCuentasPorMatricula(id_matricula);

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

  // Include tarifa for the matricula's year
  const tarifa = await getTarifa(matricula.year);

  return { matricula, cuentas, totales, tarifa };
};

// ── Commands ───────────────────────────────────────────────────

/**
 * Generates monthly "pensión" cuentas de cobro using the global tarifa.
 * Idempotent: skips months that already have a cuenta.
 *
 * @param {number} id_matricula
 * @param {number} year
 */
export const generarCuentasPension = async (id_matricula, year) => {
  const matricula = await Matricula.findByPk(id_matricula);
  if (!matricula) throw { status: 404, message: 'Matrícula no encontrada' };

  const tarifa = await getTarifa(year);
  if (!tarifa) {
    throw {
      status: 400,
      message: `No hay tarifa configurada para el año ${year}. Configura el valor de pensión y matrícula antes de generar cuentas.`,
    };
  }

  const conceptos = await ensureConceptos();
  const conceptoPension = conceptos['PENSIÓN'];

  return sequelize.transaction(async (t) => {
    const creadas = [];
    for (const mes of MESES_COBRO) {
      const [cuenta, isNew] = await CuentaCobro.findOrCreate({
        where: { id_matricula, id_concepto_pago: conceptoPension.id_concepto_pago, mes, year },
        defaults: {
          valor_deuda: tarifa.valor_pension,
          estado: 'PENDIENTE',
        },
        transaction: t,
      });
      if (isNew) creadas.push(cuenta);
    }
    return { creadas, total: MESES_COBRO.length, valor_pension: tarifa.valor_pension };
  });
};

/**
 * Creates a single "matrícula" cuenta de cobro using the global tarifa.
 * Fails if one already exists for this matricula/year.
 *
 * @param {number} id_matricula
 * @param {number} year
 */
export const crearCuentaMatricula = async (id_matricula, year) => {
  const matricula = await Matricula.findByPk(id_matricula);
  if (!matricula) throw { status: 404, message: 'Matrícula no encontrada' };

  const tarifa = await getTarifa(year);
  if (!tarifa) {
    throw {
      status: 400,
      message: `No hay tarifa configurada para el año ${year}. Configura el valor de pensión y matrícula antes de generar cuentas.`,
    };
  }

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
    mes: 1,
    year,
    valor_deuda: tarifa.valor_matricula,
    estado: 'PENDIENTE',
  });
};

/**
 * Registers a payment against a cuenta de cobro.
 * Updates cuenta estado automatically.
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
  // Actualiza vencidos globalmente antes de listar
  await actualizarVencidos();

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