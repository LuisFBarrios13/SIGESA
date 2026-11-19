// tests/docentes.test.js
// Registro de docentes: el grado a dirigir es obligatorio y debe estar libre en su jornada
// (jornada completa: libre en las dos). La cédula no puede ser de un estudiante ni de otra cuenta.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor } from './helpers/servidor.js';

const YEAR = new Date().getFullYear();

let s, admin;

const registrar = (datos) =>
  s.api('POST', '/docentes', {
    token: admin,
    body: { nombre: 'Docente Prueba', jornada: 'MAÑANA', nombreGrado: 'Primero', ...datos },
  });

before(async () => {
  s = await iniciarServidor();
  await s.crearUsuario('admin', 'clave123', 'ADMINISTRADOR');
  admin = await s.login('admin', 'clave123');
});
after(() => s?.cerrar());

test('registrar: crea el docente, su usuario (la cédula) y le asigna el grado', async () => {
  const r = await registrar({ cedula: '8001', nombre: 'Marina Capera', telefono: '3001112233', correo: 'marina@colegio.edu.co', nombreGrado: 'Pre Jardín' });
  assert.equal(r.status, 201);
  assert.deepEqual(r.body.data.gradosAsignados.map((g) => [g.nombre, g.jornada]), [['Pre Jardín', 'MAÑANA']]);
  assert.equal(r.body.data.credenciales.username, '8001');
  assert.equal(r.body.data.credenciales.passwordTemporal, '8001');

  // Entra con su cédula y tiene el rol DOCENTE
  const login = await s.api('POST', '/auth/login', { body: { username: '8001', password: '8001' } });
  assert.equal(login.status, 200);
  assert.ok(login.body.data.user.roles.includes('DOCENTE'));
});

test('registrar: el grado es obligatorio', async () => {
  const r = await s.api('POST', '/docentes', { token: admin, body: { cedula: '8002', nombre: 'Sin Grado', jornada: 'MAÑANA' } });
  assert.equal(r.status, 400);
});

test('registrar: no se puede tomar un grado ocupado en esa jornada', async () => {
  const r = await registrar({ cedula: '8003', nombreGrado: 'Pre Jardín', jornada: 'MAÑANA' });
  assert.equal(r.status, 409);
  assert.match(r.body.message, /Marina Capera/);
  // La otra jornada sí está libre
  assert.equal((await registrar({ cedula: '8004', nombre: 'Yedi Guevara', nombreGrado: 'Pre Jardín', jornada: 'TARDE' })).status, 201);
});

test('registrar: jornada completa solo en un grado libre en las dos jornadas', async () => {
  // Pre Jardín tiene docente en las dos jornadas → no
  assert.equal((await registrar({ cedula: '8005', nombreGrado: 'Pre Jardín', jornada: 'COMPLETA' })).status, 409);

  // Jardín con docente solo en la mañana → tampoco
  assert.equal((await registrar({ cedula: '8006', nombre: 'Laura Díaz', nombreGrado: 'Jardín' })).status, 201);
  assert.equal((await registrar({ cedula: '8007', nombreGrado: 'Jardín', jornada: 'COMPLETA' })).status, 409);

  // Transición libre → queda en las dos jornadas
  const r = await registrar({ cedula: '8008', nombre: 'Gisela Capera', nombreGrado: 'Transición', jornada: 'COMPLETA' });
  assert.equal(r.status, 201);
  assert.deepEqual(r.body.data.gradosAsignados.map((g) => g.jornada).sort(), ['MAÑANA', 'TARDE']);
});

test('registrar: la cédula no puede ser de un estudiante ni el usuario de otra cuenta, y no deja nada a medias', async () => {
  const { Docente, Usuario, Grado } = s.modelos;
  const idPrimero = (await Grado.findOne({ where: { nombre: 'Primero', jornada: 'MAÑANA' } })).id_grado;
  // Estudiante 1001 con acudiente 5001: el usuario del acudiente es "1001"
  const m = await s.api('POST', '/matriculas', {
    token: admin,
    body: {
      estudiante: { numero_identidad: '1001', nombre: 'Estudiante Prueba', fecha_nacimiento: '2019-03-10' },
      matricula:  { id_grado: idPrimero, year: YEAR, jornada: 'MAÑANA' },
      acudiente:  { cedula: '5001', nombre: 'Rosa Pérez' },
    },
  });
  assert.equal(m.status, 201);

  const conEstudiante = await registrar({ cedula: '1001' });
  assert.equal(conEstudiante.status, 409);
  assert.match(conEstudiante.body.message, /estudiante Estudiante Prueba/);

  await s.crearUsuario('4444', 'clave123', 'ADMINISTRADOR');
  const conCuenta = await registrar({ cedula: '4444' });
  assert.equal(conCuenta.status, 409);
  assert.match(conCuenta.body.message, /otra cuenta/);

  assert.equal(await Docente.findByPk('1001'), null);
  assert.equal(await Docente.findByPk('4444'), null);
  assert.equal(await Usuario.count({ where: { username: '1001' } }), 1);

  // Un acudiente sí puede ser docente (su usuario es otro)
  const acudiente = await registrar({ cedula: '5001', nombre: 'Rosa Pérez', nombreGrado: 'Segundo' });
  assert.equal(acudiente.status, 201);
});

test('disponibilidad: grados en orden escolar, mañana antes que tarde, con su director', async () => {
  const r = await s.api('GET', '/docentes/disponibilidad', { token: admin });
  assert.equal(r.status, 200);
  const filas = r.body.data.map((g) => `${g.nombre}·${g.jornada}`);
  assert.deepEqual(filas.slice(0, 6), [
    'Pre Jardín·MAÑANA', 'Pre Jardín·TARDE', 'Jardín·MAÑANA', 'Jardín·TARDE', 'Transición·MAÑANA', 'Transición·TARDE',
  ]);
  assert.equal(r.body.data[0].docente.nombre, 'Marina Capera');
  assert.equal(r.body.data[3].docente, null);
});

test('editar: cambia nombre, teléfono y correo; un correo inválido → 400', async () => {
  const r = await s.api('PATCH', '/docentes/8001', { token: admin, body: { nombre: 'Marina Capera Ruiz', telefono: '', correo: 'marina.c@colegio.edu.co' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.nombre, 'Marina Capera Ruiz');
  assert.equal(r.body.data.telefono, null);
  assert.equal(r.body.data.correo, 'marina.c@colegio.edu.co');

  const malo = await s.api('PATCH', '/docentes/8001', { token: admin, body: { nombre: 'Marina', correo: 'no-es-correo' } });
  assert.equal(malo.status, 400);
});

// ── Cambiar grado y jornada ─────────────────────────────────────────────────
// Estado en este punto: Marina 8001 Pre Jardín mañana · Yedi 8004 Pre Jardín tarde ·
// Laura 8006 Jardín mañana · Gisela 8008 Transición completa · Rosa 5001 Segundo mañana.
// El estudiante 1001 está matriculado en Primero mañana.

const gradosDe = async (cedula) => {
  const r = await s.api('GET', '/docentes', { token: admin });
  const d = r.body.data.find((x) => x.cedula === cedula);
  return { jornada: d.jornada, grados: d.grados.map((g) => `${g.nombre}·${g.jornada}`).sort() };
};
const estudiantesDe = async (cedula) => {
  const token = await s.login(cedula, cedula);
  const r = await s.api('GET', '/docente/estudiantes', { token });
  return r.status === 200 ? JSON.stringify(r.body.data) : `status ${r.status}`;
};
const mover = (cedula, jornada, nombreGrado) =>
  s.api('PUT', `/docentes/${cedula}/asignacion`, { token: admin, body: { jornada, nombreGrado } });
const intercambiar = (cedula, con) =>
  s.api('POST', `/docentes/${cedula}/intercambio`, { token: admin, body: { con } });

test('mover: pasa a un grado libre, suelta el anterior y ve los estudiantes (y notas) del grado nuevo', async () => {
  assert.doesNotMatch(await estudiantesDe('8006'), /Estudiante Prueba/);

  const r = await mover('8006', 'MAÑANA', 'Primero');
  assert.equal(r.status, 200);
  assert.deepEqual(await gradosDe('8006'), { jornada: 'MAÑANA', grados: ['Primero·MAÑANA'] });

  const { Grado } = s.modelos;
  assert.equal((await Grado.findOne({ where: { nombre: 'Jardín', jornada: 'MAÑANA' } })).id_docente, null);
  assert.match(await estudiantesDe('8006'), /Estudiante Prueba/);
});

test('mover: a un grado ocupado → 409 y no cambia nada', async () => {
  const r = await mover('8006', 'MAÑANA', 'Pre Jardín');
  assert.equal(r.status, 409);
  assert.match(r.body.message, /Marina Capera/);
  assert.deepEqual(await gradosDe('8006'), { jornada: 'MAÑANA', grados: ['Primero·MAÑANA'] });
});

test('mover: puede quedarse en su grado cambiando a jornada completa; el mismo grado y jornada → 400', async () => {
  const r = await mover('5001', 'COMPLETA', 'Segundo');
  assert.equal(r.status, 200);
  assert.deepEqual(await gradosDe('5001'), { jornada: 'COMPLETA', grados: ['Segundo·MAÑANA', 'Segundo·TARDE'] });

  assert.equal((await mover('5001', 'COMPLETA', 'Segundo')).status, 400);
});

test('intercambiar: cada uno queda con el grado y la jornada del otro (también con jornada completa)', async () => {
  const r = await intercambiar('8006', '8001');
  assert.equal(r.status, 200);
  assert.deepEqual(await gradosDe('8006'), { jornada: 'MAÑANA', grados: ['Pre Jardín·MAÑANA'] });
  assert.deepEqual(await gradosDe('8001'), { jornada: 'MAÑANA', grados: ['Primero·MAÑANA'] });
  // Las notas siguen con el estudiante: ahora las ve el nuevo director
  assert.match(await estudiantesDe('8001'), /Estudiante Prueba/);
  assert.doesNotMatch(await estudiantesDe('8006'), /Estudiante Prueba/);

  // Completa ↔ tarde
  assert.equal((await intercambiar('8008', '8004')).status, 200);
  assert.deepEqual(await gradosDe('8008'), { jornada: 'TARDE', grados: ['Pre Jardín·TARDE'] });
  assert.deepEqual(await gradosDe('8004'), { jornada: 'COMPLETA', grados: ['Transición·MAÑANA', 'Transición·TARDE'] });
});

test('intercambiar: consigo mismo → 400; docente que no existe → 404', async () => {
  assert.equal((await intercambiar('8006', '8006')).status, 400);
  assert.equal((await intercambiar('8006', '9999')).status, 404);
});
