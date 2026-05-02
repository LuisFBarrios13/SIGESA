// src/auth/auth.service.js
import bcrypt from 'bcryptjs';
import { Usuario, Rol } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Authenticates a user by credentials and returns a signed JWT.
 * Single Responsibility: login logic only.
 *
 * @param {string} username
 * @param {string} password
 * @returns {{ token: string, user: object }}
 */
export const loginService = async (username, password) => {
  // Fetch user with roles via the many-to-many association
  const usuario = await Usuario.findOne({
    where: { username, estado: true },
    include: [
      {
        model: Rol,
        as: 'roles',
        through: { attributes: [] }, // exclude junction table fields
      },
    ],
  });

  if (!usuario) {
    throw { status: 401, message: 'Credenciales inválidas' };
  }

  const isValid = await bcrypt.compare(password, usuario.password);
  if (!isValid) {
    throw { status: 401, message: 'Credenciales inválidas' };
  }

  const roles = usuario.roles.map((r) => r.nombre);

  const token = generateToken({
    id: usuario.id_usuario,
    username: usuario.username,
    roles,
  });

  return {
    token,
    user: {
      id: usuario.id_usuario,
      username: usuario.username,
      roles,
      primerLogin: usuario.primer_login,
    },
  };
};

/**
 * Changes password for a user. Used on first login.
 *
 * @param {number} userId
 * @param {string} newPassword
 */
export const changePasswordService = async (userId, newPassword) => {
  const usuario = await Usuario.findByPk(userId);
  if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };

  const hashed = await bcrypt.hash(newPassword, 10);
  await usuario.update({ password: hashed, primer_login: false });
};