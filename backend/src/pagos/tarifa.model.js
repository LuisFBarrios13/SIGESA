// src/pagos/tarifa.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Tarifa = sequelize.define(
  'Tarifa',
  {
    id_tarifa: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        name: 'unique_year_tarifa',
        msg: 'Ya existe una tarifa para ese año',
      },
      validate: {
        min: { args: [2000], msg: 'El año no es válido' },
      },
    },
    valor_pension: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'El valor de pensión no puede ser negativo' },
      },
    },
    valor_matricula: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'El valor de matrícula no puede ser negativo' },
      },
    },
  },
  {
    tableName: 'tarifas',
    timestamps: false,
  }
);