// src/estudiantes/estudiante.service.js
import { Op } from 'sequelize';
import { Estudiante, Matricula, Grado, RelacionEA, Acudiente } from '../models/index.js';

/**
 * Lista todos los estudiantes con su matrícula activa más reciente.
 */
export const listarEstudiantes = async () =>
  Estudiante.findAll({
    include: [
      {
        model: Matricula,
        as: 'matriculas',
        include: [{ model: Grado, as: 'grado', attributes: ['id_grado', 'nombre', 'jornada'] }],
      },
    ],
    order: [['nombre', 'ASC']],
  });

/**
 * Busca un estudiante por número de identidad e incluye
 * sus matrículas, acudientes y grados asociados.
 *
 * @param {string} numero_identidad
 */
export const obtenerEstudiante = async (numero_identidad) => {
  const estudiante = await Estudiante.findByPk(numero_identidad, {
    include: [
      {
        model: Matricula,
        as: 'matriculas',
        include: [{ model: Grado, as: 'grado' }],
      },
      {
        model: Acudiente,
        as: 'acudientes',
        through: { model: RelacionEA, attributes: ['parentesco', 'acudiente_principal'] },
        attributes: ['cedula', 'nombre', 'telefono', 'correo'],
      },
    ],
  });

  if (!estudiante) throw { status: 404, message: 'Estudiante no encontrado' };
  return estudiante;
};

/**
 * Actualiza los datos editables de un estudiante.
 * No permite cambiar el número de identidad (PK).
 *
 * @param {string} numero_identidad
 * @param {{ nombre?, fecha_nacimiento?, rh?, direccion?, observaciones? }} dto
 */
export const actualizarEstudiante = async (numero_identidad, dto) => {
  const estudiante = await Estudiante.findByPk(numero_identidad);
  if (!estudiante) throw { status: 404, message: 'Estudiante no encontrado' };

  const camposPermitidos = ['nombre', 'fecha_nacimiento', 'rh', 'direccion', 'observaciones'];
  const actualizaciones = {};

  for (const campo of camposPermitidos) {
    if (dto[campo] !== undefined) actualizaciones[campo] = dto[campo];
  }

  await estudiante.update(actualizaciones);
  return estudiante.reload();
};

/**
 * Busca estudiantes por nombre o número de identidad.
 *
 * @param {string} query - texto de búsqueda
 */
export const buscarEstudiantes = async (query) => {
  if (!query?.trim()) throw { status: 400, message: 'El parámetro de búsqueda es requerido' };

  return Estudiante.findAll({
    where: {
      [Op.or]: [
        { nombre: { [Op.iLike]: `%${query}%` } },
        { numero_identidad: { [Op.iLike]: `%${query}%` } },
      ],
    },
    include: [
      {
        model: Matricula,
        as: 'matriculas',
        include: [{ model: Grado, as: 'grado', attributes: ['id_grado', 'nombre', 'jornada'] }],
      },
    ],
    order: [['nombre', 'ASC']],
    limit: 20,
  });
};