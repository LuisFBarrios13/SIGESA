// src/notas/materia.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Materia = sequelize.define(
  'Materia',
  {
    id_materia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre de la materia no puede estar vacío' },
      },
    },
  },
  {
    tableName: 'materias',
    timestamps: false,
  }
);