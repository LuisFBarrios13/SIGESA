import bcrypt from 'bcryptjs';
import { Usuario, Rol, Docente, Acudiente } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { ROLES } from '../constants/roles.js';
import { acudienteVigente, MENSAJE_SIN_MATRICULA } from '../portal-acudiente/vigencia.js';

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

  if (!usuario) throw new AppError(401, 'Credenciales inválidas');

  const isValid = await bcrypt.compare(password, usuario.password);
  if (!isValid) throw new AppError(401, 'Credenciales inválidas');

  let roles = usuario.roles.map((r) => r.nombre);

  // Un acudiente sin estudiantes con matrícula vigente no entra. Si además tiene
  // otro rol (p. ej. es docente), entra solo con ese.
  if (roles.includes(ROLES.ACUDIENTE) && !(await acudienteVigente(usuario.id_usuario))) {
    roles = roles.filter((r) => r !== ROLES.ACUDIENTE);
    if (!roles.length) throw new AppError(403, MENSAJE_SIN_MATRICULA);
  }

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
  if (!usuario) throw new AppError(404, 'Usuario no encontrado');

  const hashed = await bcrypt.hash(newPassword, 10);
  await usuario.update({ password: hashed, primer_login: false });
};