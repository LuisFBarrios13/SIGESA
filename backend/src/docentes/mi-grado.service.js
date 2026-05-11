// src/docentes/mi-grado.service.js
// Single Responsibility: business logic for a docente querying their own data.

import { Docente, Grado, Matricula, Estudiante } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Finds the Docente record for the given id_usuario.
 * Throws 404 if the user has no linked docente profile.
 *
 * @param {number} id_usuario
 */
const findDocenteByUsuario = async (id_usuario) => {
  const docente = await Docente.findOne({
    where: { id_usuario },
    include: [{ model: Grado, as: 'grados', attributes: ['id_grado', 'nombre', 'jornada'] }],
  });
  if (!docente) {
    throw { status: 404, message: 'No se encontró un perfil de docente para este usuario.' };
  }
  return docente;
};

/**
 * Returns the docente's profile and their assigned grados.
 *
 * @param {number} id_usuario
 */
export const getPerfilDocente = async (id_usuario) => {
  const docente = await findDocenteByUsuario(id_usuario);
  return {
    cedula:  docente.cedula,
    nombre:  docente.nombre,
    telefono: docente.telefono,
    correo:   docente.correo,
    jornada:  docente.jornada,
    grados:   docente.grados.map((g) => ({
      id_grado: g.id_grado,
      nombre:   g.nombre,
      jornada:  g.jornada,
    })),
  };
};

/**
 * Returns all active students enrolled in the docente's assigned grados
 * for the given academic year.
 *
 * @param {number} id_usuario
 * @param {number} [year]  - defaults to current year
 */
export const getEstudiantesDocente = async (id_usuario, year) => {
  const docente    = await findDocenteByUsuario(id_usuario);
  const currentYear = year ?? new Date().getFullYear();

  if (!docente.grados.length) return [];

  const gradoIds = docente.grados.map((g) => g.id_grado);

  return Matricula.findAll({
    where: {
      id_grado: { [Op.in]: gradoIds },
      year:     currentYear,
      estado:   'ACTIVO',
    },
    include: [
      {
        model:      Estudiante,
        as:         'estudiante',
        attributes: ['numero_identidad', 'nombre', 'fecha_nacimiento', 'rh', 'direccion', 'observaciones'],
      },
      {
        model:      Grado,
        as:         'grado',
        attributes: ['id_grado', 'nombre', 'jornada'],
      },
    ],
    order: [[{ model: Estudiante, as: 'estudiante' }, 'nombre', 'ASC']],
  });
};