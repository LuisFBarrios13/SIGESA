// src/index.js
import { env } from './config/environment.js';
import { connectDB, sequelize } from './config/database.js';
import app from './config/app.js';

// Importar modelos para que Sequelize los registre antes del sync
import './models/index.js'; // ← agrega esta línea

const startServer = async () => {
  await connectDB();
  await sequelize.sync({ alter: env.nodeEnv === 'development' });
  console.log('✅ Modelos sincronizados con la base de datos.');

  app.listen(env.port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${env.port}`);
    console.log(`📋 Health check: http://localhost:${env.port}/api/health`);
  });
};

startServer();