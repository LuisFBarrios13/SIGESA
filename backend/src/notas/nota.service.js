// src/notas/nota.service.js
import { Op }        from 'sequelize';
import { sequelize } from '../config/database.js';
import {
  Nota, Materia, Periodo, Matricula, Docente, Grado, Estudiante, ResumenPeriodo,
} from '../models/index.js';

// ── Helpers privados ───────────────────────────────────────────────────────────

const ensurePeriodo = async (numero_periodo, year, t) => {
  const [periodo] = await Periodo.findOrCreate({
    where:    { numero_periodo, year },
    defaults: { numero_periodo, year },
    transaction: t,
  });
  return periodo;
};

const verifyDocenteOwnsMatriculas = async (id_usuario, matriculaIds) => {
  const docente = await Docente.findOne({
    where:   { id_usuario },
    include: [{ model: Grado, as: 'grados', attributes: ['id_grado'] }],
  });
  if (!docente) throw { status: 403, message: 'Perfil de docente no encontrado.' };

  const gradoIds   = new Set(docente.grados.map((g) => g.id_grado));
  const matriculas = await Matricula.findAll({ where: { id_matricula: { [Op.in]: matriculaIds } } });
  const forbidden  = matriculas.find((m) => !gradoIds.has(m.id_grado));
  if (forbidden) throw { status: 403, message: 'No tienes permiso para registrar notas en ese grado.' };
};

const parseFallas = (val) => {
  const n = parseInt(val ?? 0, 10);
  return isNaN(n) || n < 0 ? 0 : n;
};

/**
 * Devuelve la intensidad horaria a guardar:
 * - Si el usuario envió un número válido >= 0, se usa ese.
 * - Si envió null/undefined, se guarda null (heredar del catálogo).
 */
const parseIH = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const n = parseInt(val, 10);
  return isNaN(n) || n < 0 ? null : n;
};

// ── Por grado + materia (hoja clásica) ────────────────────────────────────────

export const getNotasGrado = async ({ id_grado, id_materia, numero_periodo, year }) => {
  const currentYear = year ?? new Date().getFullYear();

  const matriculas = await Matricula.findAll({
    where:   { id_grado, year: currentYear, estado: 'ACTIVO' },
    include: [{ model: Estudiante, as: 'estudiante',
                attributes: ['numero_identidad', 'nombre', 'fecha_nacimiento'] }],
    order:   [[{ model: Estudiante, as: 'estudiante' }, 'nombre', 'ASC']],
  });

  if (!matriculas.length) return { matriculas: [], notas: [] };

  const periodo = await Periodo.findOne({ where: { numero_periodo, year: currentYear } });
  if (!periodo) return { matriculas, notas: [] };

  const ids   = matriculas.map((m) => m.id_matricula);
  const notas = await Nota.findAll({
    where: { id_matricula: { [Op.in]: ids }, id_materia, id_periodo: periodo.id_periodo },
  });

  return { matriculas, notas, periodo };
};

export const guardarNotasBulk = async (id_usuario, { notas: items, id_materia, numero_periodo, year }) => {
  const filledItems = items.filter(
    (i) => i.nota !== null && i.nota !== undefined && i.nota !== '',
  );
  if (!filledItems.length) return [];

  const matriculaIds = filledItems.map((i) => i.id_matricula);
  await verifyDocenteOwnsMatriculas(id_usuario, matriculaIds);

  return sequelize.transaction(async (t) => {
    const periodo = await ensurePeriodo(numero_periodo, year, t);
    const results = [];
    for (const item of filledItems) {
      const value = parseFloat(item.nota);
      if (isNaN(value) || value < 0 || value > 10) continue;
      const fallas = parseFallas(item.fallas);
      const ih     = parseIH(item.intensidad_horaria);
      const [registro, created] = await Nota.findOrCreate({
        where:    { id_matricula: item.id_matricula, id_materia, id_periodo: periodo.id_periodo },
        defaults: { nota: value, fallas, intensidad_horaria: ih, observacion: item.observacion ?? null },
        transaction: t,
      });
      if (!created) {
        await registro.update(
          { nota: value, fallas, intensidad_horaria: ih, observacion: item.observacion ?? null },
          { transaction: t },
        );
      }
      results.push(registro);
    }
    return results;
  });
};

// ── Por estudiante (flujo principal) ──────────────────────────────────────────

/**
 * Retorna { puesto, materias[] }.
 * intensidad_horaria: usa el valor guardado en la nota si existe, sino el del catálogo de materias.
 */
export const getNotasEstudiante = async (id_matricula, numero_periodo, year) => {
  const materias = await Materia.findAll({
    order: [['orden', 'ASC'], ['nombre', 'ASC']],
  });
  const periodo  = await Periodo.findOne({ where: { numero_periodo, year } });

  const [notas, resumen] = await Promise.all([
    periodo
      ? Nota.findAll({ where: { id_matricula, id_periodo: periodo.id_periodo } })
      : Promise.resolve([]),
    periodo
      ? ResumenPeriodo.findOne({ where: { id_matricula, id_periodo: periodo.id_periodo } })
      : Promise.resolve(null),
  ]);

  const materiasData = materias.map((m) => {
    const n = notas.find((n) => n.id_materia === m.id_materia);
    return {
      id_materia: m.id_materia,
      nombre:     m.nombre,
      area:       m.area,
      // Prioridad: valor editado en la nota → valor del catálogo de materias
      intensidad_horaria: n?.intensidad_horaria ?? m.intensidad_horaria,
      nota:        n ? parseFloat(n.nota) : null,
      fallas:      n ? (n.fallas ?? 0) : 0,
      observacion: n?.observacion ?? null,
    };
  });

  return {
    puesto:        resumen?.puesto ?? null,
    observaciones: resumen?.observaciones ?? '',
    materias:      materiasData,
  };
};

export const guardarNotasEstudiante = async (
  id_usuario,
  { id_matricula, numero_periodo, year, materias: items, puesto, observaciones },
) => {
  await verifyDocenteOwnsMatriculas(id_usuario, [id_matricula]);

  return sequelize.transaction(async (t) => {
    const periodo = await ensurePeriodo(numero_periodo, year, t);
    const results = [];

    for (const item of items) {
      const fallas  = parseFallas(item.fallas);
      const ih      = parseIH(item.intensidad_horaria);
      const hasNota = item.nota !== null && item.nota !== undefined && item.nota !== '';

      if (hasNota) {
        const value = parseFloat(item.nota);
        if (isNaN(value) || value < 0 || value > 10) continue;

        const [registro, created] = await Nota.findOrCreate({
          where:    { id_matricula, id_materia: item.id_materia, id_periodo: periodo.id_periodo },
          defaults: { nota: value, fallas, intensidad_horaria: ih, observacion: item.observacion ?? null },
          transaction: t,
        });
        if (!created) {
          await registro.update(
            { nota: value, fallas, intensidad_horaria: ih, observacion: item.observacion ?? null },
            { transaction: t },
          );
        }
        results.push(registro);
      } else {
        // Sin nota — actualizar fallas/IH/observación en registro existente si existe
        const existing = await Nota.findOne({
          where: { id_matricula, id_materia: item.id_materia, id_periodo: periodo.id_periodo },
          transaction: t,
        });
        if (existing) {
          await existing.update(
            { fallas, intensidad_horaria: ih, observacion: item.observacion ?? null },
            { transaction: t },
          );
          results.push(existing);
        }
      }
    }

    // ── Persistir puesto y observaciones ─────────────────────────────────────
    if (puesto !== undefined || observaciones !== undefined) {
      const puestoVal = puesto !== null && puesto !== '' ? parseInt(puesto, 10) : null;
      const cleanPuesto = puestoVal !== null && !isNaN(puestoVal) && puestoVal >= 1 ? puestoVal : null;
      const cleanObs    = observaciones !== undefined ? (observaciones || null) : undefined;

      const [resumen, created] = await ResumenPeriodo.findOrCreate({
        where:    { id_matricula, id_periodo: periodo.id_periodo },
        defaults: {
          puesto:       cleanPuesto,
          observaciones: cleanObs ?? null,
        },
        transaction: t,
      });
      if (!created) {
        const updateData = {};
        if (puesto !== undefined)       updateData.puesto       = cleanPuesto;
        if (observaciones !== undefined) updateData.observaciones = cleanObs;
        if (Object.keys(updateData).length) {
          await resumen.update(updateData, { transaction: t });
        }
      }
    }

    return results;
  });
};