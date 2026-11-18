// tests/cierre-year.test.js
// Periodo de matrícula (el año sale de la fecha), estado PROMOCION en diciembre,
// cierre de año del 1 de enero y bloqueo de acudientes sin matrícula vigente.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor, FECHA_BASE } from './helpers/servidor.js';

const YEAR = new Date().getFullYear();
const simular = (fecha) => { process.env.FECHA_SIMULADA = fecha; };

let s, admin, idPrimero, idSegundo, cerrarYearsAnteriores;

const matricular = (doc, acudiente, year = YEAR) => s.api('POST', '/matriculas', {
  token: admin,
  body: {
    estudiante: { numero_identidad: doc, nombre: `Estudiante ${doc}`, fecha_nacimiento: '2019-03-10' },
    matricula:  { id_grado: idPrimero, year, jornada: 'MAÑANA' },
    acudiente:  { cedula: acudiente, nombre: `Acudiente ${acudiente}` },
  },
});

before(async () => {
  s = await iniciarServidor();
  ({ cerrarYearsAnteriores } = await import('../src/matriculas/periodo.js'));
  await s.crearUsuario('admin', 'clave123', 'ADMINISTRADOR');
  admin = await s.login('admin', 'clave123');
  const { Grado } = s.modelos;
  idPrimero = (await Grado.findOne({ where: { nombre: 'Primero', jornada: 'MAÑANA' } })).id_grado;
  idSegundo = (await Grado.findOne({ where: { nombre: 'Segundo', jornada: 'TARDE' } })).id_grado;
});
after(() => { simular(FECHA_BASE); return s?.cerrar(); });

test('estudiante nuevo: solo este año (ACTIVO) o el siguiente (PROMOCION); otro año → 400', async () => {
  const periodo = await s.api('GET', '/matriculas/periodo', { token: admin });
  assert.deepEqual(periodo.body.data, {
    yearEnCurso: YEAR,
    opciones: [{ year: YEAR, estado: 'ACTIVO' }, { year: YEAR + 1, estado: 'PROMOCION' }],
  });

  for (const malo of [YEAR + 2, YEAR - 1]) {
    const r = await matricular('2001', '6001', malo);
    assert.equal(r.status, 400, String(malo));
    assert.match(r.body.message, new RegExp(`Solo se puede matricular en ${YEAR} o en ${YEAR + 1}`));
  }

  const r = await matricular('2001', '6001', YEAR);
  assert.equal(r.status, 201);
  assert.equal(r.body.data.matricula.year, YEAR);
  assert.equal(r.body.data.matricula.estado, 'ACTIVO');
});

test('rematrícula en cualquier mes: activo este año → el año siguiente en PROMOCION', async () => {
  await matricular('2101', '6101');
  const consulta = await s.api('GET', '/matriculas/rematricula/2101', { token: admin });
  assert.deepEqual(consulta.body.data, { posible: true, year: YEAR + 1, estado: 'PROMOCION' });

  const r = await s.api('POST', '/matriculas/rematricula', { token: admin, body: { id_estudiante: '2101', id_grado: idSegundo } });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.year, YEAR + 1);
  assert.equal(r.body.data.estado, 'PROMOCION');

  // Ya promovido: no se puede otra vez
  const otra = await s.api('GET', '/matriculas/rematricula/2101', { token: admin });
  assert.equal(otra.body.data.posible, false);
  assert.match(otra.body.data.motivo, new RegExp(`ya tiene una matrícula en ${YEAR + 1}`));

  // Retirado este año: no se promueve
  const m = await matricular('2102', '6102');
  await s.api('PATCH', `/matriculas/${m.body.data.matricula.id_matricula}/estado`, { token: admin, body: { estado: 'RETIRADO' } });
  const retirado = await s.api('POST', '/matriculas/rematricula', { token: admin, body: { id_estudiante: '2102', id_grado: idSegundo } });
  assert.equal(retirado.status, 400);
  assert.match(retirado.body.message, /retirado/);

  // Limpieza para que no cuenten en las pruebas siguientes
  const { Matricula, RelacionEA, Estudiante } = s.modelos;
  await Matricula.destroy({ where: { id_estudiante: ['2101', '2102'] } });
  await RelacionEA.destroy({ where: { id_estudiante: ['2101', '2102'] } });
  await Estudiante.destroy({ where: { numero_identidad: ['2101', '2102'] } });
});

test('en junio: estudiante nuevo para el año siguiente y promoción quedan en PROMOCION', async () => {
  const nuevo = await matricular('2002', '6002', YEAR + 1);
  assert.equal(nuevo.status, 201);
  assert.equal(nuevo.body.data.matricula.year, YEAR + 1);
  assert.equal(nuevo.body.data.matricula.estado, 'PROMOCION');

  // Solo tiene la de PROMOCION: no se le ofrece matrícula en el año en curso
  const consulta = await s.api('GET', '/matriculas/rematricula/2002', { token: admin });
  assert.equal(consulta.body.data.posible, false);
  assert.match(consulta.body.data.motivo, new RegExp(`ya tiene una matrícula en ${YEAR + 1} \\(en promoción\\)`));
  const intento = await s.api('POST', '/matriculas/rematricula', { token: admin, body: { id_estudiante: '2002', id_grado: idSegundo } });
  assert.equal(intento.status, 409);

  // 2001 sigue ACTIVO en el año en curso y queda en PROMOCION para el siguiente
  const remat = await s.api('POST', '/matriculas/rematricula', { token: admin, body: { id_estudiante: '2001', id_grado: idSegundo } });
  assert.equal(remat.status, 201);
  assert.equal(remat.body.data.year, YEAR + 1);
  assert.equal(remat.body.data.estado, 'PROMOCION');

  // Un estudiante que NO se rematricula
  await matricular('2003', '6003');

  // Los tres acudientes entran (ACTIVO del año o PROMOCION del siguiente)
  for (const u of ['2001', '2002', '2003']) {
    assert.equal((await s.api('POST', '/auth/login', { body: { username: u, password: u } })).status, 200, u);
  }
});

test('1 de enero: el acudiente sin rematrícula queda bloqueado, aunque el cierre no haya corrido', async () => {
  const tokenViejo = await s.login('2003', '2003'); // sesión abierta el 15 de junio
  simular(`${YEAR + 1}-01-01`);

  const login = await s.api('POST', '/auth/login', { body: { username: '2003', password: '2003' } });
  assert.equal(login.status, 403);
  assert.match(login.body.message, /matrícula vigente/);

  // La sesión que ya estaba abierta también se corta
  const portal = await s.api('GET', '/acudiente/mis-estudiantes', { token: tokenViejo });
  assert.equal(portal.status, 403);

  // Contraseña equivocada sigue siendo 401 (no revela nada)
  assert.equal((await s.api('POST', '/auth/login', { body: { username: '2003', password: 'mala' } })).status, 401);
  simular(FECHA_BASE);
});

test('cierre de año: ACTIVO del año pasado → FINALIZADO; PROMOCION → ACTIVO; es idempotente', async () => {
  const { Matricula } = s.modelos;
  simular(`${YEAR + 1}-01-01`);

  const primera = await cerrarYearsAnteriores();
  assert.deepEqual(primera, { finalizadas: 2, activadas: 2 }); // 2001 y 2003 / 2001 y 2002
  assert.deepEqual(await cerrarYearsAnteriores(), { finalizadas: 0, activadas: 0 });

  const estados = Object.fromEntries((await Matricula.findAll({ order: [['id_matricula', 'ASC']] }))
    .map((m) => [`${m.id_estudiante}-${m.year}`, m.estado]));
  assert.deepEqual(estados, {
    [`2001-${YEAR}`]:     'FINALIZADO',
    [`2002-${YEAR + 1}`]: 'ACTIVO',
    [`2001-${YEAR + 1}`]: 'ACTIVO',
    [`2003-${YEAR}`]:     'FINALIZADO',
  });

  // Los rematriculados entran; el que no, sigue bloqueado
  assert.equal((await s.api('POST', '/auth/login', { body: { username: '2001', password: '2001' } })).status, 200);
  assert.equal((await s.api('POST', '/auth/login', { body: { username: '2002', password: '2002' } })).status, 200);
  assert.equal((await s.api('POST', '/auth/login', { body: { username: '2003', password: '2003' } })).status, 403);

  // Una matrícula finalizada no se retira ni se reactiva
  const fin = await Matricula.findOne({ where: { id_estudiante: '2003', year: YEAR } });
  const r = await s.api('PATCH', `/matriculas/${fin.id_matricula}/estado`, { token: admin, body: { estado: 'RETIRADO' } });
  assert.equal(r.status, 400);
  assert.match(r.body.message, /ya terminó/);

  // Si se rematricula en enero, vuelve a entrar
  const remat = await s.api('POST', '/matriculas/rematricula', { token: admin, body: { id_estudiante: '2003', id_grado: idSegundo } });
  assert.equal(remat.body.data.year, YEAR + 1);
  assert.equal(remat.body.data.estado, 'ACTIVO');
  assert.equal((await s.api('POST', '/auth/login', { body: { username: '2003', password: '2003' } })).status, 200);
  simular(FECHA_BASE);
});

test('retirar y reactivar una matrícula de promoción: vuelve a PROMOCION, no a ACTIVO', async () => {
  simular(`${YEAR + 1}-12-10`);
  const remat = await s.api('POST', '/matriculas/rematricula', { token: admin, body: { id_estudiante: '2002', id_grado: idSegundo } });
  assert.equal(remat.body.data.estado, 'PROMOCION');
  const id = remat.body.data.id_matricula;

  const retiro = await s.api('PATCH', `/matriculas/${id}/estado`, { token: admin, body: { estado: 'RETIRADO' } });
  assert.equal(retiro.body.data.matricula.estado, 'RETIRADO');
  const vuelta = await s.api('PATCH', `/matriculas/${id}/estado`, { token: admin, body: { estado: 'ACTIVO' } });
  assert.equal(vuelta.status, 200);
  assert.equal(vuelta.body.data.matricula.estado, 'PROMOCION');
  simular(FECHA_BASE);
});
