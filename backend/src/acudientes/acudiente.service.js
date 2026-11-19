// src/acudientes/acudiente.service.js
import { Op } from 'sequelize';
import { Acudiente, Estudiante, Usuario } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

/**
 * Campos que el administrador puede modificar de un acudiente.
 * La cédula (PK) y el id_usuario NO son modificables.
 */
const CAMPOS_PERMITIDOS = [
  'nombre',
  'telefono',
  'correo',
  'direccion',
  'telefono_trabajo',
  'direccion_trabajo',
];

const ATRIBUTOS = ['cedula', 'nombre', 'telefono', 'correo', 'direccion', 'telefono_trabajo', 'direccion_trabajo'];

/**
 * Busca un acudiente por su cédula o por su usuario de acceso (que es el
 * documento del primer estudiante que matriculó). Devuelve null si no existe:
 * en el formulario de matrícula eso significa "acudiente nuevo", no un error.
 * Trae el nombre de sus estudiantes («ya es acudiente de Ana Ruiz»).
 * @param {string} documento
 * @returns {Promise<Acudiente|null>}
 */
const SUS_ESTUDIANTES = { model: Estudiante, as: 'estudiantes', attributes: ['nombre'], through: { attributes: [] } };
export const buscarAcudiente = async (documento) =>
  (await Acudiente.findByPk(documento, { attributes: ATRIBUTOS, include: [SUS_ESTUDIANTES] })) ??
  Acudiente.findOne({
    attributes: ATRIBUTOS,
    include: [{ model: Usuario, as: 'usuario', attributes: [], where: { username: documento } }, SUS_ESTUDIANTES],
  });

/**
 * Coincidencias por nombre o cédula mientras se escribe (paso 3 de la matrícula).
 * Trae el nombre de sus estudiantes para reconocerlo («Acudiente de Ana Ruiz»).
 * @param {string} texto
 */
export const buscarCoincidencias = (texto) =>
  Acudiente.findAll({
    attributes: ['cedula', 'nombre', 'telefono'],
    where: {
      [Op.or]: [
        { nombre: { [Op.iLike]: `%${texto}%` } },
        { cedula: { [Op.iLike]: `%${texto}%` } },
      ],
    },
    include: [SUS_ESTUDIANTES],
    order: [['nombre', 'ASC']],
    limit: 20,
  });

/**
 * Actualiza los datos editables de un acudiente.
 *
 * @param {string} cedula
 * @param {object} dto
 * @returns {Promise<Acudiente>}
 */
export const actualizarAcudiente = async (cedula, dto) => {
  const acudiente = await Acudiente.findByPk(cedula);
  if (!acudiente) throw new AppError(404, 'Acudiente no encontrado');

  const actualizaciones = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (dto[campo] !== undefined) {
      actualizaciones[campo] =
        campo === 'nombre'
          ? dto[campo].trim()
          : dto[campo]?.trim() || null;
    }
  }

  await acudiente.update(actualizaciones);
  return acudiente.reload();
};