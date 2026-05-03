// scripts/seedGrados.js
// Crea los 8 grados de la institución en ambas jornadas (mañana y tarde)
// Ejecutar: node scripts/seedGrados.js

import { sequelize, connectDB } from '../src/config/database.js';
import { Grado } from '../src/models/index.js';

const NOMBRES_GRADOS = [
  'Pre Jardín',
  'Jardín',
  'Transición',
  'Primero',
  'Segundo',
  'Tercero',
  'Cuarto',
  'Quinto',
];

const JORNADAS = ['MAÑANA', 'TARDE'];

const seedGrados = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await connectDB();

    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync();

    console.log('🔄 Creando grados...');
    let creados = 0;
    let existentes = 0;

    for (const jornada of JORNADAS) {
      for (const nombre of NOMBRES_GRADOS) {
        const [, creado] = await Grado.findOrCreate({
          where: { nombre, jornada },
          defaults: { nombre, jornada },
        });
        if (creado) {
          console.log(`  ✅ Creado: ${nombre} – ${jornada}`);
          creados++;
        } else {
          existentes++;
        }
      }
    }

    console.log(`\n✅ Seed completado:`);
    console.log(`   📚 Grados creados:    ${creados}`);
    console.log(`   ⏭  Ya existían:       ${existentes}`);
    console.log(`   📋 Total esperado:    ${NOMBRES_GRADOS.length * JORNADAS.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed de grados:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedGrados();