// src/auth/auth.controller.js
import { loginService, changePasswordService } from './auth.service.js';
import { successResponse } from '../utils/responseHandler.js';

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  const { username, password } = req.body; // validados en auth.routes.js
  const data = await loginService(username, password);
  return successResponse(res, data, 'Login exitoso');
};

/**
 * PATCH /api/auth/change-password
 * Requires: authenticate middleware (req.user injected)
 */
export const changePassword = async (req, res) => {
  const { newPassword } = req.body; // 6 a 100 caracteres, validado en auth.routes.js
  await changePasswordService(req.user.id, newPassword);
  return successResponse(res, null, 'Contraseña actualizada correctamente');
};