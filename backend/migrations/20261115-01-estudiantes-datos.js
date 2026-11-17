// migrations/20261115-01-estudiantes-datos.js
// Datos del estudiante que pide la ficha de edición: tipo de documento
// (RC, TI, CC…), sexo y EPS. Son opcionales porque los estudiantes
// que ya existen no los tienen.
import { DataTypes } from 'sequelize';

const COLUMNAS = {
  tipo_documento: { type: DataTypes.STRING(5), allowNull: true },
  sexo:           { type: DataTypes.STRING(1), allowNull: true },
  eps:            { type: DataTypes.STRING(100), allowNull: true },
};

export const up = async ({ context: qi }) => {
  const actuales = await qi.describeTable('estudiantes');
  for (const [nombre, definicion] of Object.entries(COLUMNAS)) {
    if (!actuales[nombre]) await qi.addColumn('estudiantes', nombre, definicion);
  }
};

export const down = async ({ context: qi }) => {
  for (const nombre of Object.keys(COLUMNAS)) await qi.removeColumn('estudiantes', nombre);
};
