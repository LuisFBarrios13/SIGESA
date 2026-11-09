// src/acudientes/acudiente.service.js
import { Acudiente, Usuario } from '../models/index.js';
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
 * @param {string} documento
 * @returns {Promise<Acudiente|null>}
 */
export const buscarAcudiente = async (documento) =>
  (await Acudiente.findByPk(documento, { attributes: ATRIBUTOS })) ??
  Acudiente.findOne({
    attributes: ATRIBUTOS,
    include: [{ model: Usuario, as: 'usuario', attributes: [], where: { username: documento } }],
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

  if (!actualizaciones.nombre?.length) {
    throw new AppError(400, 'El nombre del acudiente no puede estar vacío');
  }

  await acudiente.update(actualizaciones);
  return acudiente.reload();
};