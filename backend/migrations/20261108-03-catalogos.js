// migrations/20261108-03-catalogos.js
// Datos fijos que la aplicación necesita para funcionar: roles, métodos de pago,
// grados y materias. Solo inserta lo que falte, así que es segura en una base
// que ya los tenía (antes se cargaban con scripts/seed*.js).

const ROLES    = ['ADMINISTRADOR', 'DOCENTE', 'ACUDIENTE'];
const METODOS  = ['EFECTIVO', 'TRANSFERENCIA', 'CONSIGNACIÓN', 'TARJETA'];
const GRADOS   = ['Pre Jardín', 'Jardín', 'Transición', 'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto'];
const JORNADAS = ['MAÑANA', 'TARDE'];
const MATERIAS = [
  { nombre: 'Inglés',                 area: 'IDIOMA EXTRANJERO - INGLÉS' },
  { nombre: 'Ciencias Naturales',     area: 'CIENCIAS' },
  { nombre: 'Ciencias Sociales',      area: 'CIENCIAS' },
  { nombre: 'Lengua Castellana',      area: 'HUMANIDADES' },
  { nombre: 'Matemáticas',            area: 'MATEMÁTICAS' },
  { nombre: 'Informática',            area: 'TECNOLOGÍA' },
  { nombre: 'Ética y Valores',        area: 'EDUCACIÓN ÉTICA Y VALORES' },
  { nombre: 'Educación Física',       area: 'EDUCACIÓN ARTÍSTICA, FÍSICA' },
  { nombre: 'Educación Artística',    area: 'EDUCACIÓN ARTÍSTICA, FÍSICA' },
  { nombre: 'Comportamiento General', area: 'COMPORTAMIENTO' },
];

/** INSERT ... SELECT ... WHERE NOT EXISTS: inserta la fila solo si no hay otra igual. */
const insertarSiFalta = (qi, tabla, fila, transaction) => {
  const cols   = Object.keys(fila);
  const lista  = cols.map((c) => `"${c}"`).join(', ');
  const params = cols.map((c) => `:${c}`).join(', ');
  const where  = cols.map((c) => `"${c}" = :${c}`).join(' AND ');
  return qi.sequelize.query(
    `INSERT INTO "${tabla}" (${lista}) SELECT ${params} WHERE NOT EXISTS (SELECT 1 FROM "${tabla}" WHERE ${where})`,
    { replacements: fila, transaction },
  );
};

export const up = async ({ context: qi }) => {
  await qi.sequelize.transaction(async (t) => {
    for (const nombre of ROLES)   await insertarSiFalta(qi, 'roles', { nombre }, t);
    for (const nombre of METODOS) await insertarSiFalta(qi, 'metodo_pagos', { nombre }, t);
    for (const jornada of JORNADAS) {
      for (const nombre of GRADOS) await insertarSiFalta(qi, 'grados', { nombre, jornada }, t);
    }
    // Las materias se comparan solo por nombre (el área pudo editarse).
    for (const m of MATERIAS) {
      await qi.sequelize.query(
        `INSERT INTO "materias" ("nombre", "area", "intensidad_horaria", "orden")
         SELECT :nombre, :area, 1, 0
         WHERE NOT EXISTS (SELECT 1 FROM "materias" WHERE "nombre" = :nombre)`,
        { replacements: m, transaction: t },
      );
    }
  });
};

// Los catálogos pueden estar referenciados por datos reales: no se borran.
export const down = async () => {};
