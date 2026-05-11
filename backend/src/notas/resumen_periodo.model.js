// src/notas/resumen_periodo.model.js
// Almacena el puesto (ranking) del estudiante por periodo.
// Una fila por (id_matricula, id_periodo).

import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ResumenPeriodo = sequelize.define(
  'ResumenPeriodo',
  {
    id_resumen: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_matricula: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'matriculas', key: 'id_matricula' },
    },
    id_periodo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'periodos', key: 'id_periodo' },
    },
    puesto: {
      type: DataTypes.INTEGER,
      allowNull: true,        // null = sin registrar aún
      validate: {
        min: { args: [1], msg: 'El puesto mínimo es 1' },
      },
    },
  },
  {
    tableName: 'resumenes_periodo',
    timestamps: false,
    indexes: [
      // Garantiza unicidad por matrícula + periodo
      { unique: true, fields: ['id_matricula', 'id_periodo'] },
    ],
  }
);