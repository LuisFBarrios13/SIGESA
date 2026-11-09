// src/config/app.js
import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import { errorHandler } from '../middlewares/errorHandler.middleware.js';
import { env } from './environment.js';

import authRoutes       from '../auth/auth.routes.js';
import gradoRoutes      from '../grados/grado.routes.js';
import matriculaRoutes  from '../matriculas/matricula.routes.js';
import docenteRoutes    from '../docentes/docente.routes.js';
import miGradoRoutes    from '../docentes/mi-grado.routes.js';
import pagosRoutes      from '../pagos/pagos.routes.js';
import estudianteRoutes from '../estudiantes/estudiante.routes.js';
import notaRoutes       from '../notas/nota.routes.js';
import materiaRoutes    from '../materias/materia.routes.js';
import boletinRoutes    from '../boletin/boletin.routes.js';
import acudienteRoutes  from '../acudientes/acudiente.routes.js';
import acudientePortalRoutes from '../portal-acudiente/acudiente.portal.routes.js';
import dashboardRoutes  from '../dashboard/dashboard.routes.js';

const app = express();

// Detrás de un proxy (Nginx, Render, Railway…) para que la IP del cliente sea la real.
if (env.trustProxy) app.set('trust proxy', 1);

// Cabeceras de seguridad estándar (evita sniffing de tipos, clickjacking, etc.).
app.use(helmet());

app.use(cors({ origin: env.corsOrigins.length ? env.corsOrigins : true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'SIGESA API funcionando 🚀', timestamp: new Date() });
});

app.use('/api/auth',        authRoutes);
app.use('/api/grados',      gradoRoutes);
app.use('/api/matriculas',  matriculaRoutes);
app.use('/api/docentes',    docenteRoutes);
app.use('/api/docente',     miGradoRoutes);
app.use('/api/pagos',       pagosRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/notas',       notaRoutes);
app.use('/api/materias',    materiaRoutes);
app.use('/api/boletin',     boletinRoutes);
app.use('/api/acudientes',  acudienteRoutes);
app.use('/api/acudiente',   acudientePortalRoutes);
app.use('/api/dashboard',   dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.originalUrl} no encontrada` });
});

app.use(errorHandler);

export default app;