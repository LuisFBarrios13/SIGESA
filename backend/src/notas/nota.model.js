// src/notas/nota.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Nota = sequelize.define(
  'Nota',
  {
    id_nota: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_matricula: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'matriculas', key: 'id_matricula' },
    },
    id_materia: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'materias', key: 'id_materia' },
    },
    id_periodo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'periodos', key: 'id_periodo' },
    },
    nota: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: { args: [0],  msg: 'La nota mínima es 0' },
        max: { args: [10], msg: 'La nota máxima es 10' },
      },
    },
    // Inasistencias a la materia en el periodo — default 0
    fallas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Las fallas no pueden ser negativas' },
      },
    },
    // Intensidad horaria editable por registro.
    // null = heredar el valor del catálogo de materias.
    intensidad_horaria: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: { args: [0], msg: 'La intensidad horaria no puede ser negativa' },
      },
    },
    observacion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'notas',
    timestamps: false,
  }
);