// scripts/migrar.js
//   npm run migrate          → aplica las migraciones pendientes
//   npm run migrate:status   → muestra aplicadas y pendientes
//   npm run migrate:undo     → revierte la última migración
import { sequelize, connectDB } from '../src/config/database.js';
import { migrator } from '../src/config/migrator.js';

const comando = process.argv[2] ?? 'up';

const main = async () => {
  await connectDB();
  sequelize.options.logging = false;

  if (comando === 'up') {
    const hechas = await migrator.up();
    console.log(hechas.length ? hechas.map((m) => `✅ ${m.name}`).join('\n') : '✅ No hay migraciones pendientes.');
  } else if (comando === 'down') {
    const revertidas = await migrator.down();
    console.log(revertidas.length ? `↩️  Revertida: ${revertidas[0].name}` : 'No hay migraciones para revertir.');
  } else if (comando === 'status') {
    const [hechas, pendientes] = await Promise.all([migrator.executed(), migrator.pending()]);
    hechas.forEach((m) => console.log(`✅ ${m.name}`));
    pendientes.forEach((m) => console.log(`⏳ ${m.name}`));
  } else {
    throw new Error(`Comando desconocido: ${comando} (usa up, down o status)`);
  }
  await sequelize.close();
};

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
