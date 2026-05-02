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
    timestamps: false,
  }
);
