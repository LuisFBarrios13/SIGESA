// src/periodos/periodo.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Periodo = sequelize.define(
  'Periodo',
  {
    id_periodo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    numero_periodo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'El periodo mínimo es 1' },
        max: { args: [4], msg: 'El periodo máximo es 4' },
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [2000], msg: 'El año no es válido' },
      },
    },
  },
  {
    tableName: 'periodos',
    // Creada por la migración 20261109-01-restricciones-unicas
    indexes: [{ unique: true, name: 'uq_periodos_numero_year', fields: ['numero_periodo','year'] }],
    timestamps: false,
  }
);
