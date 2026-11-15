// src/dashboard/dashboard.service.js
// Métricas del dashboard calculadas en la base de datos (antes el frontend
// descargaba todas las cuentas y las sumaba; el listado tenía tope de 100
// filas y los totales salían incompletos).
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { actualizarVencidos } from '../pagos/pagos.service.js';
import { NOTA_APROBATORIA } from '../constants/notas.js';

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const TOP_DEUDORES  = 5;
const ULTIMOS_PAGOS = 5;

/** Cuentas de cobro del año con lo pagado en cada una. */
const CUENTAS_DEL_YEAR = `
  WITH cuentas AS (
    SELECT cc.mes,
           cc.estado,
           cc.valor_deuda::float8 AS deuda,
           COALESCE((SELECT SUM(p.monto_pago) FROM pagos p WHERE p.id_cuenta_cobro = cc.id_cuenta), 0)::float8 AS pagado,
           m.id_estudiante,
           m.id_grado
      FROM cuenta_cobros cc
      JOIN matriculas m ON m.id_matricula = cc.id_matricula
     WHERE m.year = :year
  )`;

/**
 * Notas del periodo actual de las matrículas activas. Los periodos no tienen
 * fechas, así que el "periodo actual" es el más alto que ya tiene notas en el año.
 */
const NOTAS_PERIODO_ACTUAL = `
  WITH actual AS (
    SELECT MAX(pe.numero_periodo) AS numero
      FROM notas n
      JOIN periodos pe ON pe.id_periodo = n.id_periodo
     WHERE pe.year = :year
  ),
  notas_actual AS (
    SELECT n.nota::float8 AS nota, n.id_matricula, m.id_grado
      FROM notas n
      JOIN periodos pe  ON pe.id_periodo = n.id_periodo
      JOIN matriculas m ON m.id_matricula = n.id_matricula
     WHERE pe.year = :year
       AND pe.numero_periodo = (SELECT numero FROM actual)
       AND m.estado = 'ACTIVO'
  )`;

const consultar = (sql, year) =>
  sequelize.query(sql, {
    replacements: { year, aprobatoria: NOTA_APROBATORIA },
    type: QueryTypes.SELECT,
  });

const redondear = (n) => (n == null ? null : Math.round(n * 100) / 100);

export const obtenerMetricas = async (year) => {
  // Igual que el listado de pagos: primero se marcan las cuentas vencidas.
  await actualizarVencidos();

  const [
    [conteos], [totales], porMes, [deudores], topDeudores,
    grados, jornadas, ultimosPagos, [academico], promediosGrado,
  ] = await Promise.all([
    consultar(`
      SELECT (SELECT COUNT(*) FROM estudiantes)::int AS "totalEstudiantes",
             (SELECT COUNT(DISTINCT id_estudiante) FROM matriculas
               WHERE estado = 'ACTIVO' AND year = :year)::int AS "estudiantesActivos",
             (SELECT COUNT(*) FROM docentes)::int AS "totalDocentes"`, year),

    consultar(`${CUENTAS_DEL_YEAR}
      SELECT COALESCE(SUM(pagado), 0) AS "totalRecaudado",
             COALESCE(SUM(deuda), 0)  AS "totalDeuda"
        FROM cuentas`, year),

    consultar(`${CUENTAS_DEL_YEAR}
      SELECT mes, SUM(pagado) AS recaudado, SUM(deuda) AS deuda
        FROM cuentas GROUP BY mes`, year),

    consultar(`${CUENTAS_DEL_YEAR}
      SELECT COUNT(DISTINCT id_estudiante)::int AS total,
             COALESCE(SUM(GREATEST(deuda - pagado, 0)), 0)::float8 AS saldo
        FROM cuentas WHERE estado = 'VENCIDO'`, year),

    consultar(`${CUENTAS_DEL_YEAR}
      SELECT e.nombre,
             e.numero_identidad AS identidad,
             MAX(g.nombre)      AS grado,
             SUM(GREATEST(c.deuda - c.pagado, 0)) AS saldo
        FROM cuentas c
        JOIN estudiantes e ON e.numero_identidad = c.id_estudiante
        JOIN grados g      ON g.id_grado = c.id_grado
       WHERE c.estado = 'VENCIDO'
       GROUP BY e.numero_identidad, e.nombre
       ORDER BY saldo DESC
       LIMIT ${TOP_DEUDORES}`, year),

    // Todos los grados, aunque no tengan estudiantes este año.
    consultar(`
      SELECT g.id_grado AS "idGrado",
             g.nombre,
             g.jornada,
             d.nombre AS docente,
             COUNT(m.id_matricula) FILTER (WHERE m.estado = 'ACTIVO')::int AS activos
        FROM grados g
        LEFT JOIN docentes d   ON d.cedula = g.id_docente
        LEFT JOIN matriculas m ON m.id_grado = g.id_grado AND m.year = :year
       GROUP BY g.id_grado, d.nombre
       ORDER BY g.id_grado`, year),

    consultar(`
      SELECT jornada, COUNT(*)::int AS total
        FROM matriculas
       WHERE year = :year AND estado = 'ACTIVO'
       GROUP BY jornada`, year),

    consultar(`
      SELECT p.id_pago            AS "idPago",
             p.fecha_pago         AS fecha,
             p.monto_pago::float8 AS monto,
             e.nombre             AS estudiante,
             g.nombre             AS grado,
             cp.nombre            AS concepto,
             cc.mes,
             mp.nombre            AS metodo
        FROM pagos p
        JOIN cuenta_cobros cc  ON cc.id_cuenta = p.id_cuenta_cobro
        JOIN matriculas m      ON m.id_matricula = cc.id_matricula
        JOIN estudiantes e     ON e.numero_identidad = m.id_estudiante
        JOIN grados g          ON g.id_grado = m.id_grado
        JOIN concepto_pagos cp ON cp.id_concepto_pago = cc.id_concepto_pago
        JOIN metodo_pagos mp   ON mp.id_metodo = p.id_metodo_pago
       WHERE m.year = :year
       ORDER BY p.fecha_pago DESC, p.id_pago DESC
       LIMIT ${ULTIMOS_PAGOS}`, year),

    consultar(`${NOTAS_PERIODO_ACTUAL}
      SELECT (SELECT numero FROM actual)::int  AS "periodoActual",
             AVG(nota)::float8                 AS "promedioGeneral",
             COUNT(DISTINCT id_matricula)::int AS "estudiantesEvaluados",
             (COUNT(DISTINCT id_matricula) FILTER (WHERE nota < :aprobatoria))::int
                                               AS "estudiantesConMateriasPerdidas"
        FROM notas_actual`, year),

    consultar(`${NOTAS_PERIODO_ACTUAL}
      SELECT id_grado AS "idGrado", AVG(nota)::float8 AS promedio
        FROM notas_actual
       GROUP BY id_grado`, year),
  ]);

  const mesesConDatos    = new Map(porMes.map((r) => [r.mes, r]));
  const promedioPorGrado = new Map(promediosGrado.map((r) => [r.idGrado, r.promedio]));

  const porJornada = { 'MAÑANA': 0, TARDE: 0 };
  for (const { jornada, total } of jornadas) porJornada[jornada] = total;

  const porGrado = grados.map((g) => ({
    ...g,
    promedio: redondear(promedioPorGrado.get(g.idGrado) ?? null),
  }));

  return {
    ...conteos,
    tasaMatricula: conteos.totalEstudiantes > 0
      ? Math.round((conteos.estudiantesActivos / conteos.totalEstudiantes) * 100)
      : 0,
    totalRecaudado: totales.totalRecaudado,
    totalDeuda:     totales.totalDeuda,
    totalDeudores:  deudores.total,
    // Lo que deben las cuentas ya vencidas (sin contar los meses que no han llegado).
    carteraVencida: deudores.saldo,
    monthlyChart: MESES.map((month, i) => ({
      month,
      recaudado: mesesConDatos.get(i + 1)?.recaudado ?? 0,
      deuda:     mesesConDatos.get(i + 1)?.deuda ?? 0,
    })),
    topDeudores,
    porGrado,
    gradosSinDocente: porGrado.filter((g) => !g.docente).length,
    porJornada,
    ultimosPagos,
    academico: {
      periodoActual:                  academico.periodoActual,
      promedioGeneral:                redondear(academico.promedioGeneral),
      notaAprobatoria:                NOTA_APROBATORIA,
      estudiantesEvaluados:           academico.estudiantesEvaluados,
      estudiantesConMateriasPerdidas: academico.estudiantesConMateriasPerdidas,
    },
  };
};
