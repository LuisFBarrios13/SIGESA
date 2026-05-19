import bcrypt from 'bcryptjs';
import { Usuario, Rol, Docente, Acudiente } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';

export const loginService = async (username, password) => {
  const usuario = await Usuario.findOne({
    where: { username, estado: true },
    include: [
      {
        model:   Rol,
        as:      'roles',
        through: { attributes: [] },
      },
      {
        model:      Docente,
        as:         'docente',
        attributes: ['nombre'],
        required:   false,
      },
      {
        model:      Acudiente,
        as:         'acudiente',
        attributes: ['nombre'],
        required:   false,
      },
    ],
  });

  if (!usuario) throw { status: 401, message: 'Credenciales inválidas' };

  const isValid = await bcrypt.compare(password, usuario.password);
  if (!isValid) throw { status: 401, message: 'Credenciales inválidas' };

  const roles = usuario.roles.map((r) => r.nombre);

  const nombre = usuario.docente?.nombre
    ?? usuario.acudiente?.nombre
    ?? usuario.nombre
    ?? usuario.username;

  const token = generateToken({
    id:       usuario.id_usuario,
    username: usuario.username,
    roles,
  });

  return {
    token,
    user: {
      id:          usuario.id_usuario,
      username:    usuario.username,
      nombre,
      roles,
      primerLogin: usuario.primer_login,
    },
  };
};

export const changePasswordService = async (userId, newPassword) => {
  const usuario = await Usuario.findByPk(userId);
  if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };

  const hashed = await bcrypt.hash(newPassword, 10);
  await usuario.update({ password: hashed, primer_login: false });
};