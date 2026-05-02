// src/usuarios/usuario.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Usuario = sequelize.define(
  'Usuario',
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'unique_username',
        msg: 'Este nombre de usuario ya está en uso',
      },
      validate: {
        notEmpty: { msg: 'El username no puede estar vacío' },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La contraseña no puede estar vacía' },
      },
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // true = activo, false = inactivo
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // primer_login indica si el acudiente aún no cambió su contraseña
    // cuando es true, el frontend lo redirige a cambiar contraseña
    primer_login: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'usuarios',
    timestamps: false,
  }
);