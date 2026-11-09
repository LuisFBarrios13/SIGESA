// src/usuarios/usuario.service.js
import bcrypt from 'bcryptjs';
import { Usuario, Rol, Docente, Acudiente } from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import { AppError } from '../utils/AppError.js';

const SALT_ROUNDS = 10;

/**
 * Restablece la contraseña de un usuario a su valor inicial (su propio
 * usuario: la cédula del docente o el documento del estudiante para el
 * acudiente) y le obliga a cambiarla al entrar. También lo reactiva.
 *
 * Los administradores no se restablecen por aquí.
 */
const restablecerClave = async (id_usuario) => {
  const usuario = await Usuario.findByPk(id_usuario, {
    include: [{ model: Rol, as: 'roles', through: { attributes: [] } }],
  });
  if (!usuario) throw new AppError(404, 'El usuario no existe');
  if (usuario.roles.some((r) => r.nombre === ROLES.ADMINISTRADOR)) {
    throw new AppError(403, 'La contraseña de un administrador no se puede restablecer desde aquí');
  }

  await usuario.update({
    password:     await bcrypt.hash(usuario.username, SALT_ROUNDS),
    primer_login: true,
    estado:       true,
  });

  return {
    username:         usuario.username,
    passwordTemporal: usuario.username,
    nota:             'Deberá cambiar la contraseña la próxima vez que inicie sesión.',
  };
};

export const restablecerClaveDocente = async (cedula) => {
  const docente = await Docente.findByPk(cedula, { attributes: ['id_usuario'] });
  if (!docente) throw new AppError(404, 'Docente no encontrado');
  return restablecerClave(docente.id_usuario);
};

export const restablecerClaveAcudiente = async (cedula) => {
  const acudiente = await Acudiente.findByPk(cedula, { attributes: ['id_usuario'] });
  if (!acudiente) throw new AppError(404, 'Acudiente no encontrado');
  return restablecerClave(acudiente.id_usuario);
};
