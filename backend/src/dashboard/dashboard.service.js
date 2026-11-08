// src/dashboard/dashboard.service.js
// Métricas del dashboard calculadas en la base de datos (antes el frontend
// descargaba todas las cuentas y las sumaba; el listado tenía tope de 100
// filas y los totales salían incompletos).
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { actualizarVencidos } from '../pagos/pagos.service.js';

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const TOP_DEUDORES = 5;

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

const consultar = (sql, year) =>
  sequelize.query(sql, { replacements: { year }, type: QueryTypes.SELECT });

export const obtenerMetricas = async (year) => {
  // Igual que el listado de pagos: primero se marcan las cuentas vencidas.
  await actualizarVencidos();

  const [[conteos], [totales], porMes, [deudores], topDeudores] = await Promise.all([
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
      SELECT COUNT(DISTINCT id_estudiante)::int AS total
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
  ]);

  const mesesConDatos = new Map(porMes.map((r) => [r.mes, r]));

  return {
    ...conteos,
    tasaMatricula: conteos.totalEstudiantes > 0
      ? Math.round((conteos.estudiantesActivos / conteos.totalEstudiantes) * 100)
      : 0,
    totalRecaudado: totales.totalRecaudado,
    totalDeuda:     totales.totalDeuda,
    totalDeudores:  deudores.total,
    monthlyChart: MESES.map((month, i) => ({
      month,
      recaudado: mesesConDatos.get(i + 1)?.recaudado ?? 0,
      deuda:     mesesConDatos.get(i + 1)?.deuda ?? 0,
    })),
    topDeudores,
  };
};
