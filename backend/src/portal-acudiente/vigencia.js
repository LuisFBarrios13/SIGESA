// src/portal-acudiente/vigencia.js
// Un acudiente solo entra al sistema mientras alguno de sus estudiantes tenga una
// matrícula vigente: ACTIVO este año o PROMOCION para el siguiente. Cuando el año
// termina y el estudiante no se ha vuelto a matricular, el acceso se cierra.
import { Op } from 'sequelize';
import { Acudiente, Matricula, RelacionEA } from '../models/index.js';
import { ESTADOS_VIGENTES, yearEnCurso } from '../matriculas/periodo.js';
import { ROLES } from '../constants/roles.js';
import { errorResponse } from '../utils/responseHandler.js';

export const MENSAJE_SIN_MATRICULA =
  'No hay una matrícula vigente para este año. Comunícate con el colegio para matricular a tu estudiante.';

/** ¿El usuario (acudiente) tiene algún estudiante con matrícula vigente? */
export const acudienteVigente = async (id_usuario) => {
  const acudiente = await Acudiente.findOne({ where: { id_usuario }, attributes: ['cedula'] });
  if (!acudiente) return false;

  const relaciones = await RelacionEA.findAll({
    where: { id_acudiente: acudiente.cedula },
    attributes: ['id_estudiante'],
  });
  if (!relaciones.length) return false;

  const vigente = await Matricula.findOne({
    where: {
      id_estudiante: { [Op.in]: relaciones.map((r) => r.id_estudiante) },
      estado:        { [Op.in]: ESTADOS_VIGENTES },
      // Por si el cierre de año aún no ha corrido: un ACTIVO de un año pasado no cuenta.
      year:          { [Op.gte]: yearEnCurso() },
    },
    attributes: ['id_matricula'],
  });
  return !!vigente;
};

/**
 * Middleware para las rutas del portal: corta también las sesiones que se
 * abrieron antes del cierre de año (el token dura varias horas).
 */
export const requiereMatriculaVigente = async (req, res, next) => {
  if (!req.user?.roles?.includes(ROLES.ACUDIENTE)) return next();
  if (await acudienteVigente(req.user.id)) return next();
  return errorResponse(res, MENSAJE_SIN_MATRICULA, 403);
};
