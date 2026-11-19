// migrations/20261118-01-documentos-numericos.js
// Los documentos (registro civil, tarjeta de identidad y cédula) son solo números.
// Se siguen guardando como texto (VARCHAR) para no perder ceros a la izquierda ni
// pasarse del tamaño de un INTEGER, pero la base rechaza cualquier letra o signo.
// Los estudiantes, al ser menores de edad, solo tienen RC o TI.

/** Restricción, tabla, condición y qué significa un registro que no la cumple. */
export const RESTRICCIONES = [
  ['ck_estudiantes_documento_numerico', 'estudiantes', `"numero_identidad" ~ '^[0-9]{3,20}$'`, 'documentos de estudiante con letras o signos'],
  ['ck_acudientes_cedula_numerica',     'acudientes',  `"cedula" ~ '^[0-9]{3,20}$'`,           'cédulas de acudiente con letras o signos'],
  ['ck_docentes_cedula_numerica',       'docentes',    `"cedula" ~ '^[0-9]{3,20}$'`,           'cédulas de docente con letras o signos'],
  ['ck_estudiantes_tipo_documento',     'estudiantes', `"tipo_documento" IS NULL OR "tipo_documento" IN ('RC', 'TI')`, 'estudiantes con un tipo de documento distinto de RC o TI'],
];

export const up = async ({ context: qi }) => {
  const db = qi.sequelize;

  await db.transaction(async (transaction) => {
    const q = (sql) => db.query(sql, { transaction, type: 'SELECT' });

    for (const [nombre, tabla, condicion, descripcion] of RESTRICCIONES) {
      const [existe] = await q(`SELECT 1 FROM pg_constraint WHERE conname = '${nombre}'`);
      if (existe) continue;
      const malos = await q(`SELECT * FROM "${tabla}" WHERE NOT (${condicion}) LIMIT 5`);
      if (malos.length) {
        throw new Error(
          `No se puede proteger "${tabla}": hay ${descripcion}. ` +
          `Corrige estos registros y vuelve a arrancar: ${JSON.stringify(malos)}`,
        );
      }
      await db.query(`ALTER TABLE "${tabla}" ADD CONSTRAINT "${nombre}" CHECK (${condicion})`, { transaction });
    }
  });
};

export const down = async ({ context: qi }) => {
  for (const [nombre, tabla] of RESTRICCIONES) {
    await qi.sequelize.query(`ALTER TABLE "${tabla}" DROP CONSTRAINT IF EXISTS "${nombre}"`);
  }
};
