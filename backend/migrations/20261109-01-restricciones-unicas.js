// migrations/20261109-01-restricciones-unicas.js
// 1. Limpia las restricciones UNIQUE repetidas en roles.nombre: el antiguo
//    sequelize.sync({ alter: true }) creaba una nueva en cada arranque.
// 2. Agrega restricciones UNIQUE para que la base impida duplicados que antes
//    solo evitaba el código (y que un doble clic o dos usuarios a la vez
//    podían colar).

/** Restricción, tabla, columnas y qué significaría un duplicado. */
export const RESTRICCIONES = [
  ['uq_periodos_numero_year',   'periodos',       ['numero_periodo', 'year'],                          'periodos repetidos'],
  ['uq_notas_matricula_materia_periodo', 'notas', ['id_matricula', 'id_materia', 'id_periodo'],        'notas repetidas de una materia en el mismo periodo'],
  ['uq_cuentas_matricula_concepto_mes', 'cuenta_cobros', ['id_matricula', 'id_concepto_pago', 'mes', 'year'], 'cuentas de cobro repetidas'],
  ['uq_matriculas_estudiante_year', 'matriculas', ['id_estudiante', 'year'],                           'estudiantes con más de una matrícula en el mismo año'],
  ['uq_concepto_pagos_nombre',  'concepto_pagos', ['nombre'],                                          'conceptos de pago repetidos'],
  ['uq_metodo_pagos_nombre',    'metodo_pagos',   ['nombre'],                                          'métodos de pago repetidos'],
  ['uq_grados_nombre_jornada',  'grados',         ['nombre', 'jornada'],                               'grados repetidos'],
  ['uq_materias_nombre',        'materias',       ['nombre'],                                          'materias repetidas'],
];

const lista = (cols) => cols.map((c) => `"${c}"`).join(', ');

export const up = async ({ context: qi }) => {
  const db = qi.sequelize;

  await db.transaction(async (transaction) => {
    const q = (sql) => db.query(sql, { transaction, type: 'SELECT' });

    // ── 1. Restricciones repetidas en roles ──
    const repetidas = await q(`
      SELECT conname FROM pg_constraint
       WHERE conrelid = 'roles'::regclass AND contype = 'u' AND conname ~ '^roles_nombre_key[0-9]+$'`);
    for (const { conname } of repetidas) {
      await db.query(`ALTER TABLE "roles" DROP CONSTRAINT "${conname}"`, { transaction });
    }

    // ── 2. Nuevas restricciones ──
    for (const [nombre, tabla, cols, descripcion] of RESTRICCIONES) {
      const [existe] = await q(`SELECT 1 FROM pg_constraint WHERE conname = '${nombre}'`);
      if (existe) continue;

      const duplicados = await q(`
        SELECT ${lista(cols)}, COUNT(*)::int AS veces FROM "${tabla}"
         GROUP BY ${lista(cols)} HAVING COUNT(*) > 1 LIMIT 5`);
      if (duplicados.length) {
        throw new Error(
          `No se puede proteger "${tabla}": hay ${descripcion}. ` +
          `Corrige estos registros y vuelve a arrancar: ${JSON.stringify(duplicados)}`,
        );
      }
      await db.query(`ALTER TABLE "${tabla}" ADD CONSTRAINT "${nombre}" UNIQUE (${lista(cols)})`, { transaction });
    }
  });
};

export const down = async ({ context: qi }) => {
  for (const [nombre, tabla] of RESTRICCIONES) {
    await qi.sequelize.query(`ALTER TABLE "${tabla}" DROP CONSTRAINT IF EXISTS "${nombre}"`);
  }
};
