// src/usuarios/usuario_rol.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const UsuarioRol = sequelize.define(
  'UsuarioRol',
  {
    id_usuario_rol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id_usuario',
      },
    },
    id_rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id_rol',
      },
    },
  },
  {
    tableName: 'usuario_roles',
    timestamps: false,
  }
);