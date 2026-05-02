// src/usuarios/rol.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Rol = sequelize.define(
  'Rol',
  {
    id_rol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El nombre del rol no puede estar vacío' },
        isIn: {
          args: [['ADMINISTRADOR', 'DOCENTE', 'ACUDIENTE']],
          msg: 'El rol debe ser ADMINISTRADOR, DOCENTE o ACUDIENTE',
        },
      },
    },
  },
  {
    tableName: 'roles',
    timestamps: false, // esta tabla no necesita createdAt/updatedAt
  }
);