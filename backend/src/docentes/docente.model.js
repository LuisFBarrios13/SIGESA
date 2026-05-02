// src/docentes/docente.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Docente = sequelize.define(
  'Docente',
  {
    cedula: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      validate: {
        notEmpty: { msg: 'La cédula no puede estar vacía' },
      },
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre no puede estar vacío' },
      },
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    correo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: { msg: 'El correo no tiene formato válido' },
      },
    },
    // FK hacia Usuario
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id_usuario',
      },
    },
  },
  {
    tableName: 'docentes',
    timestamps: false,
  }
);