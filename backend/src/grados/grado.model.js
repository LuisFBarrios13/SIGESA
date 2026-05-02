// src/grados/grado.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Grado = sequelize.define(
  'Grado',
  {
    id_grado: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del grado no puede estar vacío' },
      },
    },
    // FK hacia Docente — director de grupo
    id_docente: {
      type: DataTypes.STRING(20),
      allowNull: true,
      references: {
        model: 'docentes',
        key: 'cedula',
      },
    },
  },
  {
    tableName: 'grados',
    timestamps: false,
  }
);