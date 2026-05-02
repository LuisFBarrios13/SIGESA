// src/estudiantes/estudiante.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Estudiante = sequelize.define(
  'Estudiante',
  {
    numero_identidad: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      validate: {
        notEmpty: { msg: 'El número de identidad no puede estar vacío' },
      },
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre no puede estar vacío' },
      },
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: { msg: 'La fecha de nacimiento no es válida' },
      },
    },
    rh: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    direccion: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'estudiantes',
    timestamps: false,
  }
);