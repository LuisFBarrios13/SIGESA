// src/auth/auth.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { login, changePassword } from './auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validar, v } from '../middlewares/validar.middleware.js';

const router = Router();

router.post('/login', validar([
  v.texto('username', 'El usuario', 100),
  v.texto('password', 'La contraseña', 100),
]), login);
router.patch('/change-password', authenticate, validar([
  body('newPassword')
    .isString().withMessage('La nueva contraseña es requerida').bail()
    .isLength({ min: 6, max: 100 }).withMessage('La nueva contraseña debe tener entre 6 y 100 caracteres'),
]), changePassword);

export default router;