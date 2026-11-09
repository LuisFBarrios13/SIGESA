// src/auth/auth.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { rateLimit } from 'express-rate-limit';
import { login, changePassword } from './auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validar, v } from '../middlewares/validar.middleware.js';

const router = Router();

// Frena ataques de fuerza bruta: máximo 10 intentos fallidos por IP cada 15 min.
// Los inicios de sesión correctos no cuentan.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.' },
});

router.post('/login', limiteLogin, validar([
  v.texto('username', 'El usuario', 100),
  v.texto('password', 'La contraseña', 100),
]), login);
router.patch('/change-password', authenticate, validar([
  body('newPassword')
    .isString().withMessage('La nueva contraseña es requerida').bail()
    .isLength({ min: 6, max: 100 }).withMessage('La nueva contraseña debe tener entre 6 y 100 caracteres'),
]), changePassword);

export default router;