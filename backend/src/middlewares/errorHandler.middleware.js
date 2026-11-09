// src/middlewares/errorHandler.middleware.js
// Único lugar donde un error se convierte en respuesta HTTP.
// Express 5 envía aquí también los errores de los controladores async,
// así que los controladores no necesitan try/catch.
import { errorResponse } from '../utils/responseHandler.js';
import { AppError } from '../utils/AppError.js';

// Mensaje para cada restricción UNIQUE de la base (ver migraciones).
const DUPLICADOS = {
  uq_matriculas_estudiante_year:      'El estudiante ya tiene una matrícula en ese año',
  uq_notas_matricula_materia_periodo: 'Esa nota ya se estaba guardando; recarga e inténtalo de nuevo',
  uq_cuentas_matricula_concepto_mes:  'Esa cuenta de cobro ya existe',
  uq_periodos_numero_year:            'El periodo se estaba creando; inténtalo de nuevo',
  uq_materias_nombre:                 'Ya existe una materia con ese nombre',
  uq_grados_nombre_jornada:           'Ya existe ese grado en esa jornada',
  usuarios_username_key:              'Ese nombre de usuario ya está en uso',
};

// Express reconoce el manejador de errores por tener 4 parámetros.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.status, err.errors);
  }

  if (err.name === 'SequelizeValidationError') {
    return errorResponse(res, 'Error de validación en base de datos', 422, err.errors.map((e) => e.message));
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    const restriccion = err.parent?.constraint;
    return errorResponse(res, DUPLICADOS[restriccion] ?? 'Ya existe un registro con ese dato', 409);
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(res, 'El registro está relacionado con otros datos', 409);
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token inválido o expirado', 401);
  }
  // JSON mal formado en el cuerpo de la petición
  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, 'El cuerpo de la petición no es JSON válido', 400);
  }

  // Error inesperado: se registra completo pero al cliente no se le dan detalles
  // (podrían revelar consultas SQL, rutas o datos internos).
  console.error(`🔴 ${req.method} ${req.originalUrl}`, err);
  return errorResponse(res, 'Error interno del servidor', 500);
};
