// src/config/app.js
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../middlewares/errorHandler.middleware.js';

// ── Route imports ─────────────────────────────────────────────
import authRoutes      from '../auth/auth.routes.js';
import gradoRoutes     from '../grados/grado.routes.js';
import matriculaRoutes from '../matriculas/matricula.routes.js';

const app = express();

// ── Global middlewares ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'SIGESA API funcionando 🚀', timestamp: new Date() });
});

// ── Domain routes ─────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/grados',     gradoRoutes);
app.use('/api/matriculas', matriculaRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.originalUrl} no encontrada` });
});

// ── Global error handler (must be last) ───────────────────────
app.use(errorHandler);

export default app;