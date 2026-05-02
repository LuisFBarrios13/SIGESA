// src/estudiantes/relacion_ea.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const RelacionEA = sequelize.define(
  'RelacionEA',
  {
    id_relacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_estudiante: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'estudiantes',
        key: 'numero_identidad',
      },
    },
    id_acudiente: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'acudientes',
        key: 'cedula',
      },
    },
    parentesco: {
      type: DataTypes.STRING(50),
      allowNull: true, // ej: padre, madre, tío, abuelo
    },
    acudiente_principal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'relacion_estudiante_acudiente',
    timestamps: false,
  }
);