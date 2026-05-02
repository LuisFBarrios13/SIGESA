// src/middlewares/errorHandler.middleware.js
import { errorResponse } from '../utils/responseHandler.js';

// Este middleware recibe 4 parámetros — Express lo detecta automáticamente como manejador de errores
export const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error no manejado:', err);

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return errorResponse(res, 'Error de validación en base de datos', 422, messages);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return errorResponse(res, 'Ya existe un registro con ese dato', 409);
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Token inválido', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'El token ha expirado', 401);
  }

  return errorResponse(res, err.message || 'Error interno del servidor', err.statusCode || 500);
};