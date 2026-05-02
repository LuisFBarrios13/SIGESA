// src/pagos/cuenta_cobro.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const CuentaCobro = sequelize.define(
  'CuentaCobro',
  {
    id_cuenta: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_matricula: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'matriculas',
        key: 'id_matricula',
      },
    },
    id_concepto_pago: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'concepto_pagos',
        key: 'id_concepto_pago',
      },
    },
    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Mes mínimo 1' },
        max: { args: [12], msg: 'Mes máximo 12' },
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valor_deuda: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'El valor no puede ser negativo' },
      },
    },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'VENCIDO'),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
  },
  {
    tableName: 'cuenta_cobros',
    timestamps: false,
  }
);