// src/config/app.js
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../middlewares/errorHandler.middleware.js';

const app = express();

// ── Middlewares globales ──────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SIGESA API funcionando 🚀', timestamp: new Date() });
});

// ── Rutas de dominio (se agregan aquí a medida que se crean) ──
// import authRoutes from '../auth/auth.routes.js';
// app.use('/api/auth', authRoutes);

// ── Ruta no encontrada ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.originalUrl} no encontrada` });
});

// ── Manejador de errores (debe ir ÚLTIMO siempre) ─────────────
app.use(errorHandler);

export default app;