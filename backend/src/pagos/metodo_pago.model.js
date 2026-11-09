// src/pagos/metodo_pago.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const MetodoPago = sequelize.define(
  'MetodoPago',
  {
    id_metodo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del método no puede estar vacío' },
      },
    },
  },
  {
    tableName: 'metodo_pagos',
    // Creada por la migración 20261109-01-restricciones-unicas
    indexes: [{ unique: true, name: 'uq_metodo_pagos_nombre', fields: ['nombre'] }],
    timestamps: false,
  }
);