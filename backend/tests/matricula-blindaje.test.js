// tests/matricula-blindaje.test.js
// Datos que el usuario (o alguien llamando la API a mano) podría mandar mal.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor, FECHA_BASE } from './helpers/servidor.js';

const YEAR = new Date().getFullYear();
let s, admin, primeroManana, segundoTarde, cerrarYearsAnteriores;

const matricular = (doc, acudiente, extra = {}) => s.api('POST', '/matriculas', {
  token: admin,
  body: {
    estudiante: { numero_identidad: doc, nombre: `Estudiante ${doc}`, fecha_nacimiento: '2019-03-10', ...extra.estudiante },
    matricula:  { id_grado: primeroManana, year: YEAR, jornada: 'MAÑANA', ...extra.matricula },
    acudiente:  { cedula: acudiente, nombre: `Acudiente ${acudiente}` },
  },
});

before(async () => {
  s = await iniciarServidor();
  ({ cerrarYearsAnteriores } = await import('../src/matriculas/periodo.js'));
  await s.crearUsuario('admin', 'clave123', 'ADMINISTRADOR');
  admin = await s.login('admin', 'clave123');
  const { Grado } = s.modelos;
  primeroManana = (await Grado.findOne({ where: { nombre: 'Primero', jornada: 'MAÑANA' } })).id_grado;
  segundoTarde  = (await Grado.findOne({ where: { nombre: 'Segundo', jornada: 'TARDE' } })).id_grado;
});
after(() => { process.env.FECHA_SIMULADA = FECHA_BASE; return s?.cerrar(); });

test('la jornada sale del grado, no de lo que mande el formulario', async () => {
  const r = await matricular('3001', '7001', { matricula: { id_grado: segundoTarde, jornada: 'MAÑANA' } });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.matricula.jornada, 'TARDE');
});

test('grado inexistente → 404 y no queda nada a medias', async () => {
  const r = await matricular('3002', '7002', { matricula: { id_grado: 99999 } });
  assert.equal(r.status, 404);
  assert.equal(await s.modelos.Estudiante.findByPk('3002'), null);
});

test('fechas imposibles: nacimiento futuro, matrícula futura o muy vieja → 400', async () => {
  const futura = `${YEAR + 1}-01-15`;
  assert.equal((await matricular('3003', '7003', { estudiante: { fecha_nacimiento: futura } })).status, 400);
  assert.equal((await matricular('3003', '7003', { matricula: { fecha_matricula: futura } })).status, 400);
  assert.equal((await matricular('3003', '7003', { matricula: { fecha_matricula: '1990-02-01' } })).status, 400);
  const ok = await matricular('3003', '7003', { matricula: { fecha_matricula: `${YEAR}-02-01` } });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.data.matricula.fecha_matricula, `${YEAR}-02-01`);
});

test('retirar con promoción: la del año siguiente también se retira y sus cobros futuros se borran', async () => {
  const { Matricula, CuentaCobro } = s.modelos;
  await matricular('3004', '7004');
  const promo = await s.api('POST', '/matriculas/rematricula', { token: admin, body: { id_estudiante: '3004', id_grado: segundoTarde } });
  assert.equal(promo.body.data.estado, 'PROMOCION');

  await s.api('POST', '/pagos/tarifas', { token: admin, body: { year: YEAR + 1, valor_pension: 100000, valor_matricula: 150000 } });
  await s.api('POST', '/pagos/cuentas/matricula', { token: admin, body: { id_matricula: promo.body.data.id_matricula, year: YEAR + 1 } });

  const actual = await Matricula.findOne({ where: { id_estudiante: '3004', year: YEAR } });
  const r = await s.api('PATCH', `/matriculas/${actual.id_matricula}/estado`, { token: admin, body: { estado: 'RETIRADO', conPromocion: true } });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.promocionRetirada, YEAR + 1);
  assert.equal((await Matricula.findByPk(promo.body.data.id_matricula)).estado, 'RETIRADO');
  assert.equal(await CuentaCobro.count({ where: { id_matricula: promo.body.data.id_matricula } }), 0);

  // Sin matrícula vigente, su acudiente ya no entra
  assert.equal((await s.api('POST', '/auth/login', { body: { username: '3004', password: '3004' } })).status, 403);

  // conPromocion solo acepta booleanos
  const malo = await s.api('PATCH', `/matriculas/${actual.id_matricula}/estado`, { token: admin, body: { estado: 'ACTIVO', conPromocion: 'si' } });
  assert.equal(malo.status, 400);

  // Si vuelve: reactivar con la promoción la devuelve a PROMOCION y el acudiente entra otra vez
  const vuelve = await s.api('PATCH', `/matriculas/${actual.id_matricula}/estado`, { token: admin, body: { estado: 'ACTIVO', conPromocion: true } });
  assert.equal(vuelve.status, 200);
  assert.equal(vuelve.body.data.promocionReactivada, YEAR + 1);
  assert.equal((await Matricula.findByPk(promo.body.data.id_matricula)).estado, 'PROMOCION');
  assert.equal((await s.api('POST', '/auth/login', { body: { username: '3004', password: '3004' } })).status, 200);
});

test('retirar sin conPromocion deja la promoción como estaba', async () => {
  const { Matricula } = s.modelos;
  await matricular('3005', '7005');
  const promo = await s.api('POST', '/matriculas/rematricula', { token: admin, body: { id_estudiante: '3005', id_grado: segundoTarde } });
  const actual = await Matricula.findOne({ where: { id_estudiante: '3005', year: YEAR } });
  const r = await s.api('PATCH', `/matriculas/${actual.id_matricula}/estado`, { token: admin, body: { estado: 'RETIRADO' } });
  assert.equal(r.body.data.promocionRetirada, null);
  assert.equal((await Matricula.findByPk(promo.body.data.id_matricula)).estado, 'PROMOCION');
});

test('cobros: solo del año de la matrícula y solo si está vigente', async () => {
  const { Matricula } = s.modelos;
  const m = await Matricula.findOne({ where: { id_estudiante: '3001', year: YEAR } });
  await s.api('POST', '/pagos/tarifas', { token: admin, body: { year: YEAR, valor_pension: 100000, valor_matricula: 150000 } });

  const otroYear = await s.api('POST', '/pagos/cuentas/pension', { token: admin, body: { id_matricula: m.id_matricula, year: YEAR + 1 } });
  assert.equal(otroYear.status, 400);
  assert.match(otroYear.body.message, /es del año/);

  const retirada = await Matricula.findOne({ where: { id_estudiante: '3005', year: YEAR } }); // retirada arriba
  const r = await s.api('POST', '/pagos/cuentas/pension', { token: admin, body: { id_matricula: retirada.id_matricula, year: YEAR } });
  assert.equal(r.status, 400);
  assert.match(r.body.message, /retirada/);

  const ok = await s.api('POST', '/pagos/cuentas/pension', { token: admin, body: { id_matricula: m.id_matricula, year: YEAR } });
  assert.equal(ok.status, 201);
});

test('cierre atrasado (servidor apagado más de un año): una promoción vieja termina FINALIZADO', async () => {
  const { Matricula } = s.modelos;
  const promo = await Matricula.findOne({ where: { id_estudiante: '3005', year: YEAR + 1 } });
  assert.equal(promo.estado, 'PROMOCION');

  process.env.FECHA_SIMULADA = `${YEAR + 2}-03-01`;
  await cerrarYearsAnteriores();
  process.env.FECHA_SIMULADA = FECHA_BASE;

  assert.equal((await promo.reload()).estado, 'FINALIZADO');
  const retirada = await Matricula.findOne({ where: { id_estudiante: '3005', year: YEAR } });
  assert.equal(retirada.estado, 'RETIRADO', 'las retiradas no cambian');
});
