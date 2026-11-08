// tests/matricula-pagos.test.js
// Flujo completo: matrícula → tarifa → cuentas de cobro → pagos → portal del acudiente.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor } from './helpers/servidor.js';

const YEAR = new Date().getFullYear();

let s, admin, idGrado, idMatricula, idEfectivo;

const nuevaMatricula = (estudianteId, acudienteCedula) => ({
  estudiante: { numero_identidad: estudianteId, nombre: `Estudiante ${estudianteId}`, fecha_nacimiento: '2019-03-10' },
  matricula:  { id_grado: idGrado, year: YEAR, jornada: 'MAÑANA' },
  acudiente:  { cedula: acudienteCedula, nombre: `Acudiente ${acudienteCedula}`, telefono: '3000000000' },
  relacion:   { parentesco: 'Madre' },
});

before(async () => {
  s = await iniciarServidor();
  await s.crearUsuario('admin', 'clave123', 'ADMINISTRADOR');
  admin = await s.login('admin', 'clave123');

  // Catálogos creados por la migración
  const grado  = await s.modelos.Grado.findOne({ where: { nombre: 'Primero', jornada: 'MAÑANA' } });
  const metodo = await s.modelos.MetodoPago.findOne({ where: { nombre: 'EFECTIVO' } });
  idGrado    = grado.id_grado;
  idEfectivo = metodo.id_metodo;
});
after(() => s?.cerrar());

test('las migraciones crean los catálogos', async () => {
  const { Rol, Grado, MetodoPago, Materia } = s.modelos;
  assert.equal(await Rol.count(), 3);
  assert.equal(await Grado.count(), 16);
  assert.equal(await MetodoPago.count(), 4);
  assert.equal(await Materia.count(), 10);
});

test('matrícula nueva crea estudiante, acudiente y su usuario', async () => {
  const { status, body } = await s.api('POST', '/matriculas', { token: admin, body: nuevaMatricula('1001', '5001') });
  assert.equal(status, 201);
  assert.equal(body.data.acudienteNuevo, true);
  assert.equal(body.data.credenciales.username, '1001');
  idMatricula = body.data.matricula.id_matricula;

  // El acudiente entra con el documento del estudiante y debe cambiar la contraseña
  const login = await s.api('POST', '/auth/login', { body: { username: '1001', password: '1001' } });
  assert.equal(login.status, 200);
  assert.deepEqual(login.body.data.user.roles, ['ACUDIENTE']);
  assert.equal(login.body.data.user.primerLogin, true);
});

test('segundo hijo con el mismo acudiente lo reutiliza', async () => {
  const { status, body } = await s.api('POST', '/matriculas', { token: admin, body: nuevaMatricula('1002', '5001') });
  assert.equal(status, 201);
  assert.equal(body.data.acudienteNuevo, false);
  assert.equal(body.data.credenciales.username, null);
});

test('estudiante repetido → 409; datos incompletos → 400', async () => {
  const repetido = await s.api('POST', '/matriculas', { token: admin, body: nuevaMatricula('1001', '5002') });
  assert.equal(repetido.status, 409);

  const incompleta = await s.api('POST', '/matriculas', { token: admin, body: { estudiante: { numero_identidad: '1003' } } });
  assert.equal(incompleta.status, 400);
});

test('sin tarifa no se pueden generar cuentas', async () => {
  const { status } = await s.api('POST', '/pagos/cuentas/pension', { token: admin, body: { id_matricula: idMatricula, year: YEAR } });
  assert.equal(status, 400);
});

test('tarifa → cuentas de pensión (idempotente) y de matrícula', async () => {
  const tarifa = await s.api('POST', '/pagos/tarifas', {
    token: admin, body: { year: YEAR, valor_pension: 150000, valor_matricula: 200000 },
  });
  assert.ok([200, 201].includes(tarifa.status), `tarifa: ${tarifa.status}`);

  const pension = await s.api('POST', '/pagos/cuentas/pension', { token: admin, body: { id_matricula: idMatricula, year: YEAR } });
  assert.ok([200, 201].includes(pension.status));
  assert.equal(pension.body.data.creadas.length, 10); // febrero a noviembre

  const otraVez = await s.api('POST', '/pagos/cuentas/pension', { token: admin, body: { id_matricula: idMatricula, year: YEAR } });
  assert.equal(otraVez.body.data.creadas.length, 0);

  const mat = await s.api('POST', '/pagos/cuentas/matricula', { token: admin, body: { id_matricula: idMatricula, year: YEAR } });
  assert.ok([200, 201].includes(mat.status));
  const repetida = await s.api('POST', '/pagos/cuentas/matricula', { token: admin, body: { id_matricula: idMatricula, year: YEAR } });
  assert.equal(repetida.status, 409);

  const resumen = await s.api('GET', `/pagos/matriculas/${idMatricula}`, { token: admin });
  assert.equal(resumen.status, 200);
  assert.equal(resumen.body.data.cuentas.length, 11);
  assert.equal(resumen.body.data.totales.deuda, 150000 * 10 + 200000);
  assert.equal(resumen.body.data.totales.pagado, 0);
});

test('pagos parciales y completos actualizan el estado y los totales', async () => {
  const cuenta = await s.modelos.CuentaCobro.findOne({ where: { id_matricula: idMatricula, mes: 1 } }); // matrícula
  const pagar  = (monto) => s.api('POST', '/pagos', {
    token: admin, body: { id_cuenta: cuenta.id_cuenta, monto_pago: monto, id_metodo_pago: idEfectivo },
  });

  const parcial = await pagar(50000);
  assert.ok([200, 201].includes(parcial.status));
  assert.equal(parcial.body.data.estado, 'PENDIENTE');
  assert.equal(parcial.body.data.saldoRestante, 150000);

  assert.equal((await pagar(150001)).status, 400); // más que el saldo
  assert.equal((await pagar(0)).status, 400);

  const total = await pagar(150000);
  assert.equal(total.body.data.estado, 'PAGADO');
  assert.equal(total.body.data.saldoRestante, 0);

  const resumen = await s.api('GET', `/pagos/matriculas/${idMatricula}`, { token: admin });
  assert.equal(resumen.body.data.totales.pagado, 200000);
  assert.equal(resumen.body.data.totales.pendiente, 150000 * 10);
});

test('dashboard: totales calculados en la base de datos', async () => {
  const { status, body } = await s.api('GET', `/dashboard?year=${YEAR}`, { token: admin });
  assert.equal(status, 200);
  const d = body.data;
  assert.equal(d.totalEstudiantes, 2);
  assert.equal(d.estudiantesActivos, 2);
  assert.equal(d.tasaMatricula, 100);
  assert.equal(d.totalDeuda, 150000 * 10 + 200000);
  assert.equal(d.totalRecaudado, 200000);
  assert.equal(d.monthlyChart.length, 12);
  assert.equal(d.monthlyChart[0].recaudado, 200000); // la cuenta de matrícula es del mes 1

  // Pensiones (feb–nov) de meses ya terminados quedan vencidas.
  const mesActual = new Date().getMonth() + 1;
  const vencidas  = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((m) => m < mesActual).length;
  assert.equal(d.totalDeudores, vencidas > 0 ? 1 : 0);
  if (vencidas > 0) assert.equal(d.topDeudores[0].saldo, 150000 * vencidas);

  assert.equal((await s.api('GET', '/dashboard?year=abc', { token: admin })).status, 400);
});

test('el acudiente ve los pagos de sus hijos y no los de otros', async () => {
  // Matrícula de otra familia
  const ajena = await s.api('POST', '/matriculas', { token: admin, body: nuevaMatricula('2001', '6001') });
  const idAjena = ajena.body.data.matricula.id_matricula;

  const token = await s.login('1001', '1001');

  const perfil = await s.api('GET', '/acudiente/mis-estudiantes', { token });
  assert.equal(perfil.status, 200);
  const ids = perfil.body.data.estudiantes.map((e) => e.numero_identidad).sort();
  assert.deepEqual(ids, ['1001', '1002']);

  const propios = await s.api('GET', `/acudiente/pagos/${idMatricula}`, { token });
  assert.equal(propios.status, 200);

  const otros = await s.api('GET', `/acudiente/pagos/${idAjena}`, { token });
  assert.equal(otros.status, 403);
});
