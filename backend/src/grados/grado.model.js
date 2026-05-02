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
    // Jornada del grupo/grado: determina en qué turno estudian los alumnos matriculados
    jornada: {
      type: DataTypes.ENUM('MAÑANA', 'TARDE'),
      allowNull: false,
      defaultValue: 'MAÑANA',
      validate: {
        isIn: {
          args: [['MAÑANA', 'TARDE']],
          msg: 'La jornada del grado debe ser MAÑANA o TARDE',
        },
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