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
    area: {
      type: DataTypes.STRING(150),
      allowNull: false,
      defaultValue: 'GENERAL',
    },
    intensidad_horaria: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    // Controla el orden de aparición en boletín y registro de notas.
    // Usar múltiplos de 10 para poder insertar materias entre existentes.
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'materias',
    timestamps: false,
  }
);