// src/estudiantes/matricula.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Matricula = sequelize.define(
  'Matricula',
  {
    id_matricula: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_grado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'grados',
        key: 'id_grado',
      },
    },
    id_estudiante: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'estudiantes',
        key: 'numero_identidad',
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Jornada en la que cursa el estudiante en esta matrícula
    jornada: {
      type: DataTypes.ENUM('MAÑANA', 'TARDE'),
      allowNull: false,
      defaultValue: 'MAÑANA',
      validate: {
        isIn: {
          args: [['MAÑANA', 'TARDE']],
          msg: 'La jornada de la matrícula debe ser MAÑANA o TARDE',
        },
      },
    },
    fecha_matricula: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.ENUM('ACTIVO', 'RETIRADO', 'GRADUADO'),
      allowNull: false,
      defaultValue: 'ACTIVO',
    },
  },
  {
    tableName: 'matriculas',
    timestamps: false,
  }
);