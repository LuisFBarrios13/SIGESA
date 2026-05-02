// src/auth/auth.routes.js
import { Router } from 'express';
import { login, changePassword } from './auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.patch('/change-password', authenticate, changePassword);

export default router;