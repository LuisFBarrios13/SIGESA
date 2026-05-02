// src/auth/auth.controller.js
import { loginService, changePasswordService } from './auth.service.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, 'Username y contraseña son requeridos', 400);
    }

    const data = await loginService(username, password);
    return successResponse(res, data, 'Login exitoso');
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};

/**
 * PATCH /api/auth/change-password
 * Requires: authenticate middleware (req.user injected)
 */
export const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return errorResponse(res, 'La nueva contraseña debe tener al menos 6 caracteres', 400);
    }

    await changePasswordService(req.user.id, newPassword);
    return successResponse(res, null, 'Contraseña actualizada correctamente');
  } catch (err) {
    if (err.status) return errorResponse(res, err.message, err.status);
    next(err);
  }
};