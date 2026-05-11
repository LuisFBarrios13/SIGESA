// scripts/seedMaterias.js
// Crea las materias del colegio agrupadas por área académica.
// Ejecutar: node scripts/seedMaterias.js

import { sequelize, connectDB } from '../src/config/database.js';
import { Materia }               from '../src/models/index.js';

const MATERIAS = [
  { nombre: 'Inglés',                 area: 'IDIOMA EXTRANJERO - INGLÉS',  intensidad_horaria: 1 },
  { nombre: 'Ciencias Naturales',     area: 'CIENCIAS',                    intensidad_horaria: 1 },
  { nombre: 'Ciencias Sociales',      area: 'CIENCIAS',                    intensidad_horaria: 1 },
  { nombre: 'Lengua Castellana',      area: 'HUMANIDADES',                 intensidad_horaria: 1 },
  { nombre: 'Matemáticas',            area: 'MATEMÁTICAS',                 intensidad_horaria: 1 },
  { nombre: 'Informática',            area: 'TECNOLOGÍA',                  intensidad_horaria: 1 },
  { nombre: 'Ética y Valores',        area: 'EDUCACIÓN ÉTICA Y VALORES',   intensidad_horaria: 1 },
  { nombre: 'Educación Física',       area: 'EDUCACIÓN ARTÍSTICA, FÍSICA', intensidad_horaria: 1 },
  { nombre: 'Educación Artística',    area: 'EDUCACIÓN ARTÍSTICA, FÍSICA', intensidad_horaria: 1 },
  { nombre: 'Comportamiento General', area: 'COMPORTAMIENTO',              intensidad_horaria: 1 },
];

const seed = async () => {
  try {
    await connectDB();
    await sequelize.sync({ alter: true });

    let creadas = 0, actualizadas = 0;

    for (const m of MATERIAS) {
      const [registro, isNew] = await Materia.findOrCreate({
        where:    { nombre: m.nombre },
        defaults: m,
      });
      if (!isNew) {
        await registro.update({ area: m.area, intensidad_horaria: m.intensidad_horaria });
        actualizadas++;
      } else {
        creadas++;
        console.log(`  ✅ Creada: ${m.nombre} (${m.area})`);
      }
    }

    console.log(`\n✅ Seed: creadas ${creadas} | actualizadas ${actualizadas}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seed();