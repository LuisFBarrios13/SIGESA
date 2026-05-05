// scripts/seedMetodos.js
// Crea los métodos de pago por defecto en la base de datos.
// Ejecutar: node scripts/seedMetodos.js

import { sequelize, connectDB } from '../src/config/database.js';
import { MetodoPago } from '../src/models/index.js';

const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'CONSIGNACIÓN', 'TARJETA'];

const seedMetodos = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await connectDB();

    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync();

    console.log('🔄 Creando métodos de pago...');
    let creados = 0;
    let existentes = 0;

    for (const nombre of METODOS) {
      const [, creado] = await MetodoPago.findOrCreate({
        where: { nombre },
        defaults: { nombre },
      });
      if (creado) {
        console.log(`  ✅ Creado: ${nombre}`);
        creados++;
      } else {
        existentes++;
      }
    }

    console.log(`\n✅ Seed completado:`);
    console.log(`   💳 Métodos creados:    ${creados}`);
    console.log(`   ⏭  Ya existían:       ${existentes}`);
    console.log(`   📋 Total esperado:    ${METODOS.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed de métodos:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedMetodos();