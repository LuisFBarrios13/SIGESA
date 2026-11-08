// src/portal-acudiente/acudiente.portal.service.js
import { Acudiente, Estudiante, Matricula, Grado, RelacionEA, CuentaCobro, ConceptoPago, MetodoPago, Pago, Tarifa } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Devuelve el perfil del acudiente + sus estudiantes vinculados con matrículas.
 * @param {number} id_usuario
 */
export const getMisEstudiantes = async (id_usuario) => {
  const acudiente = await Acudiente.findOne({
    where: { id_usuario },
  });

  if (!acudiente) throw { status: 404, message: 'No se encontró un perfil de acudiente para este usuario.' };

  // Estudiantes vinculados a través de RelacionEA
  const relaciones = await RelacionEA.findAll({
    where: { id_acudiente: acudiente.cedula },
    include: [
      {
        model: Estudiante,
        as: 'estudiante',
        include: [
          {
            model: Matricula,
            as: 'matriculas',
            include: [{ model: Grado, as: 'grado', attributes: ['id_grado', 'nombre', 'jornada'] }],
          },
        ],
      },
    ],
  });

  const estudiantes = relaciones.map((r) => ({
    ...r.estudiante.toJSON(),
    RelacionEA: {
      parentesco: r.parentesco,
      acudiente_principal: r.acudiente_principal,
    },
  }));

  return {
    cedula:      acudiente.cedula,
    nombre:      acudiente.nombre,
    telefono:    acudiente.telefono,
    correo:      acudiente.correo,
    estudiantes,
  };
};

/**
 * Devuelve el resumen de pagos de una matrícula para el acudiente.
 * Verifica que la matrícula pertenece a un estudiante del acudiente.
 * @param {number} id_usuario
 * @param {number} id_matricula
 */
export const getResumenPagos = async (id_usuario, id_matricula) => {
  const acudiente = await Acudiente.findOne({ where: { id_usuario } });
  if (!acudiente) throw { status: 404, message: 'Perfil de acudiente no encontrado.' };

  // Verificar que la matrícula pertenece a un estudiante del acudiente
  const matricula = await Matricula.findByPk(id_matricula, {
    include: [
      { model: Estudiante, as: 'estudiante' },
      { model: Grado,      as: 'grado' },
    ],
  });

  if (!matricula) throw { status: 404, message: 'Matrícula no encontrada.' };

  // Comprobar vínculo
  const relacion = await RelacionEA.findOne({
    where: {
      id_acudiente: acudiente.cedula,
      id_estudiante: matricula.id_estudiante,
    },
  });
  if (!relacion) throw { status: 403, message: 'No tienes acceso a esta matrícula.' };

  // Cuentas de cobro con pagos
  const cuentas = await CuentaCobro.findAll({
    where: { id_matricula },
    include: [
      { model: ConceptoPago, as: 'concepto' },
      {
        model: Pago,
        as: 'pagos',
        include: [{ model: MetodoPago, as: 'metodo' }],
        order: [['fecha_pago', 'DESC']],
      },
    ],
    order: [['mes', 'ASC'], ['id_cuenta', 'ASC']],
  });

  const totales = cuentas.reduce(
    (acc, c) => {
      const pagado = (c.pagos ?? []).reduce((s, p) => s + parseFloat(p.monto_pago), 0);
      acc.deuda     += parseFloat(c.valor_deuda);
      acc.pagado    += pagado;
      acc.pendiente += Math.max(0, parseFloat(c.valor_deuda) - pagado);
      return acc;
    },
    { deuda: 0, pagado: 0, pendiente: 0 },
  );

  const tarifa = await Tarifa.findOne({ where: { year: matricula.year } });

  return {
    matricula: {
      id_matricula: matricula.id_matricula,
      year:         matricula.year,
      jornada:      matricula.jornada,
      estado:       matricula.estado,
      estudiante:   {
        numero_identidad: matricula.estudiante.numero_identidad,
        nombre:           matricula.estudiante.nombre,
      },
      grado: {
        id_grado: matricula.grado.id_grado,
        nombre:   matricula.grado.nombre,
        jornada:  matricula.grado.jornada,
      },
    },
    cuentas,
    totales,
    tarifa,
  };
};