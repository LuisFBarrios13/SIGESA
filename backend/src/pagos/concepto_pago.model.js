// src/pagos/concepto_pago.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ConceptoPago = sequelize.define(
  'ConceptoPago',
  {
    id_concepto_pago: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del concepto no puede estar vacío' },
      },
    },
  },
  {
    tableName: 'concepto_pagos',
    // Creada por la migración 20261109-01-restricciones-unicas
    indexes: [{ unique: true, name: 'uq_concepto_pagos_nombre', fields: ['nombre'] }],
    timestamps: false,
  }
);