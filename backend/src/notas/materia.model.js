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
    // Área académica para agrupar en el boletín
    area: {
      type: DataTypes.STRING(150),
      allowNull: false,
      defaultValue: 'GENERAL',
    },
    // Intensidad horaria semanal
    intensidad_horaria: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: 'materias',
    timestamps: false,
  }
);