// src/config/migrator.js
// Migraciones de base de datos con Umzug. Cada archivo de /migrations exporta
// up() y down(); las aplicadas quedan registradas en la tabla "SequelizeMeta".
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './database.js';

const carpeta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');

export const migrator = new Umzug({
  migrations: {
    // glob necesita barras "/" también en Windows
    glob: `${carpeta.split(path.sep).join('/')}/*.js`,
    resolve: ({ name, path: archivo, context }) => {
      const cargar = () => import(pathToFileURL(archivo).href);
      return {
        name,
        up:   async () => (await cargar()).up({ context }),
        down: async () => (await cargar()).down({ context }),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger:  undefined,
});

/** Aplica las migraciones pendientes y devuelve sus nombres. */
export const migrarPendientes = async () => {
  const aplicadas = await migrator.up();
  return aplicadas.map((m) => m.name);
};
