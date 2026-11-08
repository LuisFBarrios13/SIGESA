// migrations/20261108-02-usuarios-nombre.js
// Agrega usuarios.nombre (nombre visible para usuarios sin docente/acudiente,
// p. ej. el administrador). Antes estaba mal anidado dentro de "username"
// en el modelo y por eso nunca se creó la columna.
import { DataTypes } from 'sequelize';

export const up = async ({ context: qi }) => {
  const columnas = await qi.describeTable('usuarios');
  if (columnas.nombre) return;
  await qi.addColumn('usuarios', 'nombre', { type: DataTypes.STRING(150), allowNull: true });
};

export const down = async ({ context: qi }) => {
  await qi.removeColumn('usuarios', 'nombre');
};
