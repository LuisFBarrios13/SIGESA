// migrations/20261108-01-esquema-inicial.js
// Esquema de la base tal como estaba al dejar de usar sequelize.sync({ alter: true }).
// En una base que ya tenía las tablas (creadas por sync) no hace nada:
// solo queda registrada como aplicada.

const SQL = [
  `CREATE TABLE IF NOT EXISTS "roles" ("id_rol"  SERIAL , "nombre" VARCHAR(50) NOT NULL UNIQUE, PRIMARY KEY ("id_rol"));`,
  `CREATE TABLE IF NOT EXISTS "usuarios" ("id_usuario"  SERIAL , "username" VARCHAR(100) NOT NULL, "password" VARCHAR(255) NOT NULL, "estado" BOOLEAN NOT NULL DEFAULT true, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL, "primer_login" BOOLEAN NOT NULL DEFAULT false, UNIQUE ("username"), PRIMARY KEY ("id_usuario"));`,
  `CREATE TABLE IF NOT EXISTS "usuario_roles" ("id_usuario_rol"  SERIAL , "id_usuario" INTEGER NOT NULL REFERENCES "usuarios" ("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE, "id_rol" INTEGER NOT NULL REFERENCES "roles" ("id_rol") ON DELETE CASCADE ON UPDATE CASCADE, UNIQUE ("id_usuario", "id_rol"), PRIMARY KEY ("id_usuario_rol"));`,
  `CREATE TABLE IF NOT EXISTS "acudientes" ("cedula" VARCHAR(20) , "nombre" VARCHAR(150) NOT NULL, "direccion" VARCHAR(200), "telefono" VARCHAR(20), "direccion_trabajo" VARCHAR(200), "telefono_trabajo" VARCHAR(20), "correo" VARCHAR(100), "id_usuario" INTEGER NOT NULL REFERENCES "usuarios" ("id_usuario") ON DELETE NO ACTION ON UPDATE CASCADE, PRIMARY KEY ("cedula"));`,
  `DO 'BEGIN CREATE TYPE "public"."enum_docentes_jornada" AS ENUM(''MAÑANA'', ''TARDE'', ''COMPLETA''); EXCEPTION WHEN duplicate_object THEN null; END';`,
  `CREATE TABLE IF NOT EXISTS "docentes" ("cedula" VARCHAR(20) , "nombre" VARCHAR(150) NOT NULL, "telefono" VARCHAR(20), "correo" VARCHAR(100), "jornada" "public"."enum_docentes_jornada" NOT NULL DEFAULT 'MAÑANA', "id_usuario" INTEGER NOT NULL REFERENCES "usuarios" ("id_usuario") ON DELETE NO ACTION ON UPDATE CASCADE, PRIMARY KEY ("cedula"));`,
  `CREATE TABLE IF NOT EXISTS "estudiantes" ("numero_identidad" VARCHAR(20) , "nombre" VARCHAR(150) NOT NULL, "fecha_nacimiento" DATE NOT NULL, "rh" VARCHAR(5), "direccion" VARCHAR(200), "observaciones" TEXT, PRIMARY KEY ("numero_identidad"));`,
  `CREATE TABLE IF NOT EXISTS "relacion_estudiante_acudiente" ("id_relacion"  SERIAL , "id_estudiante" VARCHAR(20) NOT NULL REFERENCES "estudiantes" ("numero_identidad") ON DELETE CASCADE ON UPDATE CASCADE, "id_acudiente" VARCHAR(20) NOT NULL REFERENCES "acudientes" ("cedula") ON DELETE CASCADE ON UPDATE CASCADE, "parentesco" VARCHAR(50), "acudiente_principal" BOOLEAN NOT NULL DEFAULT false, UNIQUE ("id_estudiante", "id_acudiente"), PRIMARY KEY ("id_relacion"));`,
  `DO 'BEGIN CREATE TYPE "public"."enum_grados_jornada" AS ENUM(''MAÑANA'', ''TARDE''); EXCEPTION WHEN duplicate_object THEN null; END';`,
  `CREATE TABLE IF NOT EXISTS "grados" ("id_grado"  SERIAL , "nombre" VARCHAR(100) NOT NULL, "jornada" "public"."enum_grados_jornada" NOT NULL DEFAULT 'MAÑANA', "id_docente" VARCHAR(20) REFERENCES "docentes" ("cedula") ON DELETE SET NULL ON UPDATE CASCADE, PRIMARY KEY ("id_grado"));`,
  `DO 'BEGIN CREATE TYPE "public"."enum_matriculas_jornada" AS ENUM(''MAÑANA'', ''TARDE''); EXCEPTION WHEN duplicate_object THEN null; END';`,
  `DO 'BEGIN CREATE TYPE "public"."enum_matriculas_estado" AS ENUM(''ACTIVO'', ''RETIRADO'', ''GRADUADO''); EXCEPTION WHEN duplicate_object THEN null; END';`,
  `CREATE TABLE IF NOT EXISTS "matriculas" ("id_matricula"  SERIAL , "id_grado" INTEGER NOT NULL REFERENCES "grados" ("id_grado") ON DELETE NO ACTION ON UPDATE CASCADE, "id_estudiante" VARCHAR(20) NOT NULL REFERENCES "estudiantes" ("numero_identidad") ON DELETE NO ACTION ON UPDATE CASCADE, "year" INTEGER NOT NULL, "jornada" "public"."enum_matriculas_jornada" NOT NULL DEFAULT 'MAÑANA', "fecha_matricula" DATE NOT NULL, "estado" "public"."enum_matriculas_estado" NOT NULL DEFAULT 'ACTIVO', PRIMARY KEY ("id_matricula"));`,
  `CREATE TABLE IF NOT EXISTS "periodos" ("id_periodo"  SERIAL , "numero_periodo" INTEGER NOT NULL, "year" INTEGER NOT NULL, PRIMARY KEY ("id_periodo"));`,
  `CREATE TABLE IF NOT EXISTS "concepto_pagos" ("id_concepto_pago"  SERIAL , "nombre" VARCHAR(100) NOT NULL, PRIMARY KEY ("id_concepto_pago"));`,
  `CREATE TABLE IF NOT EXISTS "metodo_pagos" ("id_metodo"  SERIAL , "nombre" VARCHAR(50) NOT NULL, PRIMARY KEY ("id_metodo"));`,
  `DO 'BEGIN CREATE TYPE "public"."enum_cuenta_cobros_estado" AS ENUM(''PENDIENTE'', ''PAGADO'', ''VENCIDO''); EXCEPTION WHEN duplicate_object THEN null; END';`,
  `CREATE TABLE IF NOT EXISTS "cuenta_cobros" ("id_cuenta"  SERIAL , "id_matricula" INTEGER NOT NULL REFERENCES "matriculas" ("id_matricula") ON DELETE NO ACTION ON UPDATE CASCADE, "id_concepto_pago" INTEGER NOT NULL REFERENCES "concepto_pagos" ("id_concepto_pago") ON DELETE NO ACTION ON UPDATE CASCADE, "mes" INTEGER NOT NULL, "year" INTEGER NOT NULL, "valor_deuda" DECIMAL(12,2) NOT NULL, "estado" "public"."enum_cuenta_cobros_estado" NOT NULL DEFAULT 'PENDIENTE', PRIMARY KEY ("id_cuenta"));`,
  `CREATE TABLE IF NOT EXISTS "pagos" ("id_pago"  SERIAL , "id_cuenta_cobro" INTEGER NOT NULL REFERENCES "cuenta_cobros" ("id_cuenta") ON DELETE NO ACTION ON UPDATE CASCADE, "fecha_pago" DATE NOT NULL, "monto_pago" DECIMAL(12,2) NOT NULL, "id_metodo_pago" INTEGER NOT NULL REFERENCES "metodo_pagos" ("id_metodo") ON DELETE NO ACTION ON UPDATE CASCADE, "observaciones" TEXT, PRIMARY KEY ("id_pago"));`,
  `CREATE TABLE IF NOT EXISTS "tarifas" ("id_tarifa"  SERIAL , "year" INTEGER NOT NULL, "valor_pension" DECIMAL(12,2) NOT NULL, "valor_matricula" DECIMAL(12,2) NOT NULL, UNIQUE ("year"), PRIMARY KEY ("id_tarifa"));`,
  `CREATE TABLE IF NOT EXISTS "materias" ("id_materia"  SERIAL , "nombre" VARCHAR(100) NOT NULL, "area" VARCHAR(150) NOT NULL DEFAULT 'GENERAL', "intensidad_horaria" INTEGER NOT NULL DEFAULT 1, "orden" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("id_materia"));`,
  `CREATE TABLE IF NOT EXISTS "notas" ("id_nota"  SERIAL , "id_matricula" INTEGER NOT NULL REFERENCES "matriculas" ("id_matricula") ON DELETE NO ACTION ON UPDATE CASCADE, "id_materia" INTEGER NOT NULL REFERENCES "materias" ("id_materia") ON DELETE NO ACTION ON UPDATE CASCADE, "id_periodo" INTEGER NOT NULL REFERENCES "periodos" ("id_periodo") ON DELETE NO ACTION ON UPDATE CASCADE, "nota" DECIMAL(5,2) NOT NULL, "fallas" INTEGER NOT NULL DEFAULT 0, "intensidad_horaria" INTEGER DEFAULT NULL, "observacion" TEXT, PRIMARY KEY ("id_nota"));`,
  `CREATE TABLE IF NOT EXISTS "resumenes_periodo" ("id_resumen"  SERIAL , "id_matricula" INTEGER NOT NULL REFERENCES "matriculas" ("id_matricula") ON DELETE NO ACTION ON UPDATE CASCADE, "id_periodo" INTEGER NOT NULL REFERENCES "periodos" ("id_periodo") ON DELETE NO ACTION ON UPDATE CASCADE, "puesto" INTEGER, "observaciones" TEXT, PRIMARY KEY ("id_resumen"));`,
  `CREATE UNIQUE INDEX "resumenes_periodo_id_matricula_id_periodo" ON "resumenes_periodo" ("id_matricula", "id_periodo")`,
];

export const up = async ({ context: qi }) => {
  const tablas = await qi.showAllTables();
  if (tablas.includes('usuarios')) return; // base existente: ya tiene el esquema

  await qi.sequelize.transaction(async (transaction) => {
    for (const sql of SQL) await qi.sequelize.query(sql, { transaction });
  });
};

export const down = async () => {
  throw new Error('La migración del esquema inicial no se puede revertir (borraría todos los datos).');
};
