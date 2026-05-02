// src/middlewares/auth.middleware.js
import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/responseHandler.js';

/**
 * Verifies Bearer token and injects req.user.
 * Single Responsibility: authentication only.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(res, 'Token de autenticación requerido', 401);
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch {
    return errorResponse(res, 'Token inválido o expirado', 401);
  }
};

/**
 * Factory that checks req.user.roles against allowed roles.
 * Open/Closed: extend roles without modifying internals.
 * @param {...string} roles - allowed role names
 */
export const authorize = (...roles) =>
  (req, res, next) => {
    const userRoles = req.user?.roles ?? [];
    const hasRole = roles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      return errorResponse(res, 'No tienes permisos para esta acción', 403);
    }
    next();
  };