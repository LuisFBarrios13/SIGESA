// src/boletin/boletin.service.js
import { Op } from 'sequelize';
import {
  Matricula, Estudiante, Grado, Docente,
  Materia, Nota, Periodo, ResumenPeriodo,
} from '../models/index.js';

// ── Nivel de desempeño ─────────────────────────────────────────────────────────
const nivelDesempeño = (nota) => {
  if (nota == null) return '';
  if (nota >= 4.6) return 'SUPERIOR';
  if (nota >= 4.0) return 'ALTO';
  if (nota >= 3.0) return 'BÁSICO';
  return 'BAJO';
};

// ── Servicio principal ─────────────────────────────────────────────────────────
export const getBoletinData = async (id_matricula, numero_periodo, year) => {

  // 1. Matrícula con estudiante + grado + docente (nombre viene de Docente, no de Usuario)
  const matricula = await Matricula.findOne({
    where: { id_matricula },
    include: [
      { model: Estudiante, as: 'estudiante' },
      {
        model: Grado,
        as:    'grado',
        include: [{ model: Docente, as: 'docente' }],
      },
    ],
  });

  if (!matricula) throw { status: 404, message: 'Matrícula no encontrada.' };

  // 2. Catálogo de materias ordenado por área y nombre
  const materias = await Materia.findAll({
    order: [['area', 'ASC'], ['nombre', 'ASC']],
  });

  // 3. Todos los periodos del año (para mostrar P1-P4 en el boletín)
  const todosLosPeriodos = await Periodo.findAll({ where: { year } });
  const periodoMap = new Map(todosLosPeriodos.map((p) => [p.numero_periodo, p]));

  // 4. Todas las notas del estudiante para el año en un solo query
  const periodoIds = todosLosPeriodos.map((p) => p.id_periodo);
  const todasLasNotas = periodoIds.length
    ? await Nota.findAll({
        where: { id_matricula, id_periodo: { [Op.in]: periodoIds } },
      })
    : [];

  // 5. Periodo actual y puesto
  const periodoActual = periodoMap.get(numero_periodo) ?? null;

  const resumen = periodoActual
    ? await ResumenPeriodo.findOne({
        where: { id_matricula, id_periodo: periodoActual.id_periodo },
      })
    : null;

  // 6. Construir áreas con materias completas
  const areaMap = new Map();

  for (const materia of materias) {
    // Notas de todos los periodos { 1: 4.5, 2: 3.0, … }
    const notas_periodos = {};
    for (const [numPer, per] of periodoMap.entries()) {
      const n = todasLasNotas.find(
        (n) => n.id_materia === materia.id_materia && n.id_periodo === per.id_periodo,
      );
      if (n) notas_periodos[numPer] = parseFloat(n.nota);
    }

    // Nota del periodo seleccionado
    const notaActual = periodoActual
      ? todasLasNotas.find(
          (n) => n.id_materia === materia.id_materia && n.id_periodo === periodoActual.id_periodo,
        )
      : null;

    const nota_periodo_actual = notaActual ? parseFloat(notaActual.nota) : null;

    // I.H.: valor editado en la nota del periodo; si no, del catálogo
    const intensidad_horaria = notaActual?.intensidad_horaria ?? materia.intensidad_horaria;

    // Fallas del periodo actual, default 0
    const fallas = notaActual?.fallas ?? 0;

    if (!areaMap.has(materia.area)) areaMap.set(materia.area, []);
    areaMap.get(materia.area).push({
      id_materia:         materia.id_materia,
      nombre:             materia.nombre,
      intensidad_horaria,
      fallas,
      nota_periodo_actual,
      desempeño:          nivelDesempeño(nota_periodo_actual),
      notas_periodos,
    });
  }

  const areas = Array.from(areaMap.entries()).map(([nombre, mats]) => ({
    nombre,
    materias: mats,
  }));

  // 7. Promedio general del periodo actual
  const notasValidas = areas
    .flatMap((a) => a.materias)
    .map((m) => m.nota_periodo_actual)
    .filter((n) => n != null);

  const promedio_general = notasValidas.length
    ? notasValidas.reduce((s, n) => s + n, 0) / notasValidas.length
    : 0;

  // 8. Nombre directora de grupo — viene directamente del modelo Docente
  const directora = matricula.grado?.docente?.nombre ?? '—';

  // 9. Timestamp de generación
  const generado_en = new Date().toLocaleString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  return {
    estudiante:       { nombre: matricula.estudiante.nombre },
    grado:            { nombre: matricula.grado.nombre, jornada: matricula.grado.jornada },
    matricula:        { year: matricula.year },
    periodo:          numero_periodo,
    directora,
    puesto:           resumen?.puesto ?? null,
    promedio_general,
    areas,
    observaciones:    '',
    generado_en,
  };
};