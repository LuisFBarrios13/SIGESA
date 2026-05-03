// src/grados/grado.service.js
import { sequelize } from '../config/database.js';
import { Grado, Docente } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Conflict detection: can a docente be assigned to a grado?
 *
 * Rules (Single Responsibility — this function only checks conflicts):
 *  1. A docente with jornada COMPLETA already covers all shifts → no slot available.
 *  2. A docente with jornada MAÑANA cannot be assigned to another MAÑANA or COMPLETA grado.
 *  3. A docente with jornada TARDE cannot be assigned to another TARDE or COMPLETA grado.
 *  4. A grado in jornada MAÑANA cannot receive a docente who already has MAÑANA or COMPLETA.
 *  5. A grado in jornada TARDE cannot receive a docente who already has TARDE or COMPLETA.
 *
 * @param {string} cedula_docente
 * @param {number} id_grado - the target grado
 * @param {number|null} excludeGradoId - ignore this grado when checking (for updates)
 * @returns {{ conflict: boolean, reason?: string }}
 */
const checkDocenteGradoConflict = async (cedula_docente, id_grado, excludeGradoId = null) => {
  const [docente, targetGrado] = await Promise.all([
    Docente.findByPk(cedula_docente),
    Grado.findByPk(id_grado),
  ]);

  if (!docente) return { conflict: true, reason: 'Docente no encontrado' };
  if (!targetGrado) return { conflict: true, reason: 'Grado no encontrado' };

  const jornadaDocente = docente.jornada;    // MAÑANA | TARDE | COMPLETA
  const jornadaGrado = targetGrado.jornada;  // MAÑANA | TARDE

  // Determine which shifts the docente would "consume" if assigned
  const docenteCoversShifts = jornadaDocente === 'COMPLETA'
    ? ['MAÑANA', 'TARDE']
    : [jornadaDocente];

  // The grado's shift must be covered by the docente
  if (!docenteCoversShifts.includes(jornadaGrado)) {
    return {
      conflict: true,
      reason: `El docente tiene jornada ${jornadaDocente} y no puede cubrir la jornada ${jornadaGrado} del grado`,
    };
  }

  // Find all grados currently assigned to this docente (excluding the one we're updating)
  const whereClause = {
    id_docente: cedula_docente,
    ...(excludeGradoId ? { id_grado: { [Op.ne]: excludeGradoId } } : {}),
  };

  const gradosAsignados = await Grado.findAll({ where: whereClause });

  // Compute occupied shifts for this docente across all assigned grados
  const shiftsTaken = new Set();
  for (const g of gradosAsignados) {
    if (g.jornada === 'MAÑANA') shiftsTaken.add('MAÑANA');
    else if (g.jornada === 'TARDE') shiftsTaken.add('TARDE');
  }

  // Check if the target shift is already occupied
  if (shiftsTaken.has(jornadaGrado)) {
    return {
      conflict: true,
      reason: `El docente ya tiene asignado un grado en jornada ${jornadaGrado}`,
    };
  }

  // If docente is COMPLETA, assigning to ANY grado means they'd cover MAÑANA+TARDE,
  // but they can only do that if neither shift is already taken
  if (jornadaDocente === 'COMPLETA') {
    const alreadyHasAny = shiftsTaken.size > 0;
    if (alreadyHasAny) {
      return {
        conflict: true,
        reason: 'El docente tiene jornada COMPLETA y ya tiene un grado asignado en alguna jornada',
      };
    }
  }

  return { conflict: false };
};

// ── Query helpers (Interface Segregation) ─────────────────────

/**
 * Returns all grados with their assigned docente.
 */
export const listarGrados = async () =>
  Grado.findAll({
    include: [
      {
        model: Docente,
        as: 'docente',
        attributes: ['cedula', 'nombre', 'jornada'],
      },
    ],
    order: [['nombre', 'ASC']],
  });

/**
 * Returns grados that can still receive a docente, grouped by availability.
 * Used by the frontend assignment form.
 */
export const listarGradosDisponibles = async () => {
  const grados = await listarGrados();
  return grados.map((g) => ({
    ...g.toJSON(),
    tieneDocente: !!g.id_docente,
  }));
};

/**
 * Returns docentes with information about their current shift usage.
 */
export const listarDocentesConDisponibilidad = async () => {
  const docentes = await Docente.findAll({
    include: [
      {
        model: Grado,
        as: 'grados',
        attributes: ['id_grado', 'nombre', 'jornada'],
      },
    ],
    order: [['nombre', 'ASC']],
  });

  return docentes.map((d) => {
    const json = d.toJSON();
    const shiftsTaken = new Set(json.grados.map((g) => g.jornada));

    let disponible;
    if (json.jornada === 'COMPLETA') {
      // COMPLETA docente can only be assigned if they have NO grados yet
      disponible = json.grados.length === 0;
    } else {
      // MAÑANA or TARDE docente is available if their shift isn't taken
      disponible = !shiftsTaken.has(json.jornada);
    }

    return { ...json, disponible, jornadasOcupadas: [...shiftsTaken] };
  });
};

// ── Command handlers (Open/Closed — add new operations without touching others) ──

/**
 * Assigns a docente to a grado.
 * Validates jornada compatibility and conflict rules.
 *
 * @param {number} id_grado
 * @param {string|null} cedula_docente - null means "remove assignment"
 */
export const asignarDocenteAGrado = async (id_grado, cedula_docente) => {
  return sequelize.transaction(async (t) => {
    const grado = await Grado.findByPk(id_grado, { transaction: t });
    if (!grado) throw { status: 404, message: 'Grado no encontrado' };

    // Allow removing the docente (set to null)
    if (cedula_docente === null) {
      await grado.update({ id_docente: null }, { transaction: t });
      return grado.reload({
        include: [{ model: Docente, as: 'docente', attributes: ['cedula', 'nombre', 'jornada'] }],
        transaction: t,
      });
    }

    // Conflict check (exclude current grado so an idempotent re-assign works)
    const check = await checkDocenteGradoConflict(cedula_docente, id_grado, id_grado);
    if (check.conflict) {
      throw { status: 409, message: check.reason };
    }

    await grado.update({ id_docente: cedula_docente }, { transaction: t });

    return grado.reload({
      include: [{ model: Docente, as: 'docente', attributes: ['cedula', 'nombre', 'jornada'] }],
      transaction: t,
    });
  });
};

/**
 * Creates a new grado.
 */
export const crearGrado = async ({ nombre, jornada }) => {
  if (!nombre?.trim()) throw { status: 400, message: 'El nombre del grado es requerido' };
  if (!['MAÑANA', 'TARDE'].includes(jornada)) {
    throw { status: 400, message: 'La jornada debe ser MAÑANA o TARDE' };
  }

  const existe = await Grado.findOne({ where: { nombre: nombre.trim(), jornada } });
  if (existe) {
    throw { status: 409, message: `Ya existe el grado "${nombre.trim()}" en jornada ${jornada}` };
  }

  return Grado.create({ nombre: nombre.trim(), jornada, id_docente: null });
};