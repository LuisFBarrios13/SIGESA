// src/config/database.js
import { Sequelize } from 'sequelize';
import { env } from './environment.js';

export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: 'postgres',
    logging: env.nodeEnv === 'development'
      ? (msg) => console.log(`[SQL] ${msg}`)
      : false,
    pool: {
      max: 10,       // máximo 10 conexiones simultáneas
      min: 0,
      acquire: 30000, // tiempo máximo esperando una conexión (ms)
      idle: 10000,    // tiempo antes de liberar una conexión inactiva (ms)
    },
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente.');
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    process.exit(1);
  }
};