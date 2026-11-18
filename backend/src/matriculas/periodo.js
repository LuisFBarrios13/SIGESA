// src/matriculas/periodo.js
// Calendario de matrículas.
//
// • Un estudiante nuevo se matricula en el año en curso (ACTIVO) o en el siguiente
//   (PROMOCION). No hay más opciones: ningún otro año es válido.
// • Un estudiante que ya está activo este año se promueve al siguiente (PROMOCION).
// • El 1 de enero (o la primera vez que el servidor corra después) las matrículas
//   ACTIVO de años anteriores pasan a FINALIZADO y las de PROMOCION a ACTIVO.
// Así un estudiante nunca tiene dos matrículas activas a la vez.
import { Op } from 'sequelize';
import { Matricula } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

/** Matrículas que dan acceso al sistema (portal del acudiente, pagos…). */
export const ESTADOS_VIGENTES = ['ACTIVO', 'PROMOCION'];

/**
 * Fecha de hoy. En desarrollo y pruebas se puede simular con FECHA_SIMULADA=AAAA-MM-DD;
 * en producción siempre es la fecha real.
 */
export const hoy = () => {
  const simulada = process.env.FECHA_SIMULADA;
  if (simulada && process.env.NODE_ENV !== 'production') return new Date(`${simulada}T12:00:00`);
  return new Date();
};

export const yearEnCurso = () => hoy().getFullYear();

/** AAAA-MM-DD de una fecha, en hora local (la zona horaria del colegio, ver environment.js). */
export const fechaISO = (d = hoy()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Los dos años en que se puede matricular hoy, con el estado que toma cada uno. */
export const opcionesMatricula = () => {
  const year = yearEnCurso();
  return [
    { year,           estado: 'ACTIVO' },
    { year: year + 1, estado: 'PROMOCION' },
  ];
};

/** Estado de una matrícula nueva para ese año; cualquier año que no sea este o el siguiente → 400. */
export const estadoParaYear = (year) => {
  const opcion = opcionesMatricula().find((o) => o.year === Number(year));
  if (!opcion) {
    const [actual, siguiente] = opcionesMatricula();
    throw new AppError(400, `Solo se puede matricular en ${actual.year} o en ${siguiente.year}`);
  }
  return opcion.estado;
};

/**
 * Cierre de año. Idempotente: se puede correr cuantas veces se quiera.
 * @returns {Promise<{ finalizadas: number, activadas: number }>}
 */
export const cerrarYearsAnteriores = async () => {
  const year = yearEnCurso();
  // Primero se activan las promociones y después se finalizan los años pasados: así, si el
  // servidor estuvo apagado más de un año, una promoción vieja termina FINALIZADO y no ACTIVO.
  const [activadas] = await Matricula.update(
    { estado: 'ACTIVO' },
    { where: { estado: 'PROMOCION', year: { [Op.lte]: year } } },
  );
  const [finalizadas] = await Matricula.update(
    { estado: 'FINALIZADO' },
    { where: { estado: 'ACTIVO', year: { [Op.lt]: year } } },
  );
  return { finalizadas, activadas };
};

/** Corre el cierre ahora y luego cada hora (por si el servidor queda encendido el 31 de diciembre). */
export const programarCierreDeYear = () => {
  const correr = () => cerrarYearsAnteriores()
    .then(({ finalizadas, activadas }) => {
      if (finalizadas || activadas) {
        console.log(`📅 Cierre de año: ${finalizadas} matrículas finalizadas, ${activadas} de promoción activadas`);
      }
    })
    .catch((err) => console.error('❌ Cierre de año falló:', err.message));
  const listo = correr();
  setInterval(correr, 60 * 60 * 1000).unref();
  return listo;
};
