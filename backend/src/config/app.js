// src/config/app.js
import express from 'express';
import cors    from 'cors';
import { errorHandler } from '../middlewares/errorHandler.middleware.js';

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

const app = express();

app.use(cors());
app.use(express.json());
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

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.originalUrl} no encontrada` });
});

app.use(errorHandler);

export default app;