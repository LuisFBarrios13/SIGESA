// migrations/20261117-01-matriculas-promocion-finalizado.js
// Nuevos estados de matrícula:
//   PROMOCION  → matriculado para el año siguiente mientras termina el actual.
//   FINALIZADO → el año escolar de esa matrícula terminó.
// GRADUADO deja de usarse (los del último grado también quedan en FINALIZADO).
// Postgres no permite quitar valores de un ENUM, así que GRADUADO queda en el tipo sin uso.

export const up = async ({ context: qi }) => {
  await qi.sequelize.query(`ALTER TYPE "public"."enum_matriculas_estado" ADD VALUE IF NOT EXISTS 'PROMOCION'`);
  await qi.sequelize.query(`ALTER TYPE "public"."enum_matriculas_estado" ADD VALUE IF NOT EXISTS 'FINALIZADO'`);
  await qi.sequelize.query(`UPDATE matriculas SET estado = 'FINALIZADO' WHERE estado = 'GRADUADO'`);
};

export const down = async ({ context: qi }) => {
  await qi.sequelize.query(`UPDATE matriculas SET estado = 'ACTIVO'   WHERE estado = 'PROMOCION'`);
  await qi.sequelize.query(`UPDATE matriculas SET estado = 'GRADUADO' WHERE estado = 'FINALIZADO'`);
};
