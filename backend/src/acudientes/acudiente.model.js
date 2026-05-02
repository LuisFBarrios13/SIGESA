// src/acudientes/acudiente.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Acudiente = sequelize.define(
  'Acudiente',
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
    direccion: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    direccion_trabajo: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    telefono_trabajo: {
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
    // FK hacia Usuario — el acudiente tiene un usuario para iniciar sesión
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
    tableName: 'acudientes',
    timestamps: false,
  }
);