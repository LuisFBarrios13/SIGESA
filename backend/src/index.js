// src/index.js
import { env } from './config/environment.js';
import { connectDB } from './config/database.js';
import { migrarPendientes } from './config/migrator.js';
import app from './config/app.js';

// Importar modelos para que Sequelize registre modelos y asociaciones
import './models/index.js';

const startServer = async () => {
  await connectDB();

  // El esquema se maneja con migraciones (carpeta /migrations), no con sync().
  const aplicadas = await migrarPendientes();
  aplicadas.forEach((nombre) => console.log(`🗃️  Migración aplicada: ${nombre}`));

  app.listen(env.port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${env.port}`);
    console.log(`📋 Health check: http://localhost:${env.port}/api/health`);
  });
};

startServer().catch((err) => {
  console.error('❌ No se pudo iniciar el servidor:', err);
  process.exit(1);
});
