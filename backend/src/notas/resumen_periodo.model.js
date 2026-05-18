// src/notas/resumen_periodo.model.js
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
      allowNull: true,
      validate: {
        min: { args: [1], msg: 'El puesto mínimo es 1' },
      },
    },
    // Observaciones generales del estudiante en el periodo
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'resumenes_periodo',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['id_matricula', 'id_periodo'] },
    ],
  }
);