// src/boletin/boletin.service.js
// Single Responsibility: build the complete data structure for an academic report card.

import { Matricula, Estudiante, Grado, Docente, Nota, Materia, Periodo } from '../models/index.js';
import { Op } from 'sequelize';

// ── Constants ──────────────────────────────────────────────────────────────────

const DESEMPEÑO_LABELS = [
  { min: 4.6, label: 'SUPERIOR' },
  { min: 4.0, label: 'ALTO' },
  { min: 3.0, label: 'BÁSICO' },
  { min: 0,   label: 'BAJO' },
];

/**
 * Returns the qualitative performance label for a numeric grade.
 * Follows the Colombian national evaluation system.
 */
const getDesempeño = (nota) => {
  if (nota == null) return null;
  const n = parseFloat(nota);
  return DESEMPEÑO_LABELS.find((d) => n >= d.min)?.label ?? 'BAJO';
};

/**
 * Calculates the average of an array of numbers.
 * Returns null for empty arrays.
 */
const promedio = (values) => {
  const valid = values.filter((v) => v != null);
  if (!valid.length) return null;
  const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
  return Math.round(avg * 100) / 100;
};

/**
 * Groups an array of materias by their `area` field.
 * Preserves insertion order of areas.
 */
const groupByArea = (materias) => {
  const map = new Map();
  for (const m of materias) {
    if (!map.has(m.area)) map.set(m.area, []);
    map.get(m.area).push(m);
  }
  return Array.from(map.entries()).map(([nombre, items]) => ({ nombre, materias: items }));
};

// ── Service ────────────────────────────────────────────────────────────────────

/**
 * Returns the full data required to render an academic report card.
 *
 * @param {number} id_matricula
 * @param {number} periodo       - 1 to 4
 * @param {number} year
 */
export const getBoletinData = async (id_matricula, periodo, year) => {
  // 1 ── Matricula + student + grade + teacher (director de grado)
  const matricula = await Matricula.findByPk(id_matricula, {
    include: [
      { model: Estudiante, as: 'estudiante' },
      {
        model: Grado, as: 'grado',
        include: [{ model: Docente, as: 'docente', attributes: ['nombre', 'cedula'] }],
      },
    ],
  });

  if (!matricula) throw { status: 404, message: 'Matrícula no encontrada' };

  // 2 ── All periods for this year
  const periodos = await Periodo.findAll({ where: { year } });
  const periodoIds = periodos.map((p) => p.id_periodo);

  // 3 ── All subjects ordered by area → nombre
  const materias = await Materia.findAll({
    order: [['area', 'ASC'], ['nombre', 'ASC']],
  });

  // 4 ── All notes for this matricula across all subjects and periods
  const notas = periodoIds.length
    ? await Nota.findAll({
        where: {
          id_matricula,
          id_periodo: { [Op.in]: periodoIds },
        },
      })
    : [];

  // Helper: find nota value for a given materia + periodo number
  const findNota = (id_materia, numeroPeriodo) => {
    const per = periodos.find((p) => p.numero_periodo === numeroPeriodo);
    if (!per) return null;
    const n = notas.find((n) => n.id_materia === id_materia && n.id_periodo === per.id_periodo);
    return n ? parseFloat(n.nota) : null;
  };

  // 5 ── Build per-subject rows
  const materiaRows = materias.map((m) => {
    const notasPeriodo = {
      1: findNota(m.id_materia, 1),
      2: findNota(m.id_materia, 2),
      3: findNota(m.id_materia, 3),
      4: findNota(m.id_materia, 4),
    };

    // Nota for the requested period specifically
    const notaPeriodoActual = notasPeriodo[periodo];

    // Running average up to the current period
    const valoresHastaAhora = [1, 2, 3, 4]
      .filter((p) => p <= periodo)
      .map((p) => notasPeriodo[p]);
    const promedioMateria = promedio(valoresHastaAhora);

    return {
      id_materia:          m.id_materia,
      nombre:              m.nombre.toUpperCase(),
      area:                m.area,
      intensidad_horaria:  m.intensidad_horaria,
      fallas:              0, // extendable when attendance module exists
      notas_periodos:      notasPeriodo,
      nota_periodo_actual: notaPeriodoActual,
      promedio:            promedioMateria,
      desempeño:           getDesempeño(notaPeriodoActual),
    };
  });

  // 6 ── General average for the current period
  const notasPeriodoActual = materiaRows
    .map((m) => m.nota_periodo_actual)
    .filter((n) => n != null);
  const promedioGeneral = promedio(notasPeriodoActual) ?? 0;

  // 7 ── Class ranking (puesto) — sorts all students by their period average
  const compañerosMatriculas = await Matricula.findAll({
    where: { id_grado: matricula.id_grado, year, estado: 'ACTIVO' },
    attributes: ['id_matricula'],
  });

  const compañeroIds = compañerosMatriculas.map((m) => m.id_matricula);

  const notasCompañeros = periodoIds.length
    ? await Nota.findAll({
        where: {
          id_matricula: { [Op.in]: compañeroIds },
          id_periodo:   { [Op.in]: periodoIds.filter((id) => {
            const p = periodos.find((p) => p.id_periodo === id);
            return p && p.numero_periodo <= periodo;
          }) },
        },
        attributes: ['id_matricula', 'nota'],
      })
    : [];

  const promediosPorEstudiante = compañeroIds.map((idMat) => {
    const sus = notasCompañeros.filter((n) => n.id_matricula === idMat);
    return {
      id_matricula: idMat,
      avg: promedio(sus.map((n) => parseFloat(n.nota))) ?? 0,
    };
  });

  promediosPorEstudiante.sort((a, b) => b.avg - a.avg);
  const puesto = promediosPorEstudiante.findIndex((e) => e.id_matricula === id_matricula) + 1;

  // 8 ── Build final response
  return {
    estudiante: {
      nombre:           matricula.estudiante.nombre,
      numero_identidad: matricula.estudiante.numero_identidad,
    },
    grado: {
      nombre:  matricula.grado.nombre,
      jornada: matricula.jornada,
    },
    matricula: {
      id_matricula: matricula.id_matricula,
      year:         matricula.year,
    },
    directora:        matricula.grado?.docente?.nombre ?? '—',
    periodo,
    puesto:           puesto || 1,
    total_estudiantes: compañeroIds.length,
    promedio_general:  promedioGeneral,
    areas:             groupByArea(materiaRows),
    observaciones:     '',
    generado_en:       new Date().toLocaleString('es-CO', {
      timeZone:    'America/Bogota',
      year:        'numeric', month: '2-digit', day: '2-digit',
      hour:        '2-digit', minute: '2-digit', second: '2-digit',
    }),
  };
};