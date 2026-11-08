// src/acudientes/acudiente.service.js
import { Acudiente } from '../models/index.js';

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

/**
 * Busca un acudiente por cédula.
 * @param {string} cedula
 * @returns {Promise<Acudiente>}
 */
export const obtenerAcudiente = async (cedula) => {
  const acudiente = await Acudiente.findByPk(cedula, {
    attributes: ['cedula', 'nombre', 'telefono', 'correo', 'direccion', 'telefono_trabajo', 'direccion_trabajo'],
  });
  if (!acudiente) throw { status: 404, message: 'Acudiente no encontrado' };
  return acudiente;
};

/**
 * Actualiza los datos editables de un acudiente.
 *
 * @param {string} cedula
 * @param {object} dto
 * @returns {Promise<Acudiente>}
 */
export const actualizarAcudiente = async (cedula, dto) => {
  const acudiente = await Acudiente.findByPk(cedula);
  if (!acudiente) throw { status: 404, message: 'Acudiente no encontrado' };

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
    throw { status: 400, message: 'El nombre del acudiente no puede estar vacío' };
  }

  await acudiente.update(actualizaciones);
  return acudiente.reload();
};