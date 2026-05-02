// src/pagos/pago.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Pago = sequelize.define(
  'Pago',
  {
    id_pago: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_cuenta_cobro: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cuenta_cobros',
        key: 'id_cuenta',
      },
    },
    fecha_pago: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    monto_pago: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: { args: [0.01], msg: 'El monto debe ser mayor a 0' },
      },
    },
    id_metodo_pago: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'metodo_pagos',
        key: 'id_metodo',
      },
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'pagos',
    timestamps: false,
  }
);