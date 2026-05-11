// src/notas/nota.service.js
import { Op }                                                            from 'sequelize';
import { sequelize }                                                     from '../config/database.js';
import { Nota, Materia, Periodo, Matricula, Docente, Grado, Estudiante } from '../models/index.js';

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

  const gradoIds = new Set(docente.grados.map((g) => g.id_grado));
  const matriculas = await Matricula.findAll({
    where: { id_matricula: { [Op.in]: matriculaIds } },
  });
  const forbidden = matriculas.find((m) => !gradoIds.has(m.id_grado));
  if (forbidden) throw { status: 403, message: 'No tienes permiso para registrar notas en ese grado.' };
};

// ── Por grado + materia (hoja de cálculo clásica) ─────────────────────────────

export const getNotasGrado = async ({ id_grado, id_materia, numero_periodo, year }) => {
  const currentYear = year ?? new Date().getFullYear();

  const matriculas = await Matricula.findAll({
    where:   { id_grado, year: currentYear, estado: 'ACTIVO' },
    include: [{ model: Estudiante, as: 'estudiante', attributes: ['numero_identidad', 'nombre', 'fecha_nacimiento'] }],
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
      const [registro, created] = await Nota.findOrCreate({
        where:    { id_matricula: item.id_matricula, id_materia, id_periodo: periodo.id_periodo },
        defaults: { nota: value, observacion: item.observacion ?? null },
        transaction: t,
      });
      if (!created) await registro.update({ nota: value, observacion: item.observacion ?? null }, { transaction: t });
      results.push(registro);
    }
    return results;
  });
};

// ── Por estudiante (nuevo flujo principal) ────────────────────────────────────

export const getNotasEstudiante = async (id_matricula, numero_periodo, year) => {
  const materias = await Materia.findAll({ order: [['area', 'ASC'], ['nombre', 'ASC']] });
  const periodo  = await Periodo.findOne({ where: { numero_periodo, year } });
  const notas    = periodo
    ? await Nota.findAll({ where: { id_matricula, id_periodo: periodo.id_periodo } })
    : [];

  return materias.map((m) => {
    const n = notas.find((n) => n.id_materia === m.id_materia);
    return {
      id_materia:         m.id_materia,
      nombre:             m.nombre,
      area:               m.area,
      intensidad_horaria: m.intensidad_horaria,
      nota:               n ? parseFloat(n.nota) : null,
      observacion:        n?.observacion ?? null,
    };
  });
};

export const guardarNotasEstudiante = async (id_usuario, { id_matricula, numero_periodo, year, materias: items }) => {
  await verifyDocenteOwnsMatriculas(id_usuario, [id_matricula]);

  const filled = items.filter(
    (i) => i.nota !== null && i.nota !== undefined && i.nota !== '',
  );
  if (!filled.length) return [];

  return sequelize.transaction(async (t) => {
    const periodo = await ensurePeriodo(numero_periodo, year, t);
    const results = [];
    for (const item of filled) {
      const value = parseFloat(item.nota);
      if (isNaN(value) || value < 0 || value > 10) continue;
      const [registro, created] = await Nota.findOrCreate({
        where:    { id_matricula, id_materia: item.id_materia, id_periodo: periodo.id_periodo },
        defaults: { nota: value, observacion: item.observacion ?? null },
        transaction: t,
      });
      if (!created) await registro.update({ nota: value, observacion: item.observacion ?? null }, { transaction: t });
      results.push(registro);
    }
    return results;
  });
};