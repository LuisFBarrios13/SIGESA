// src/constants/grados.js — orden escolar de los grados.
import { sequelize } from '../config/database.js';

/** De menor a mayor, con los nombres tal como están en la tabla grados. */
export const ORDEN_GRADOS = ['Pre Jardín', 'Jardín', 'Transición', 'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto'];

/**
 * Para el `order` de Sequelize: grados en orden escolar y, dentro de cada uno,
 * mañana antes que tarde. Un grado que no esté en la lista queda al final (por nombre).
 */
export const ORDEN_ESCOLAR = [
  [sequelize.literal(`array_position(ARRAY[${ORDEN_GRADOS.map((g) => sequelize.escape(g)).join(', ')}]::text[], "Grado"."nombre"::text)`), 'ASC'],
  ['nombre', 'ASC'],
  ['jornada', 'ASC'],
];
