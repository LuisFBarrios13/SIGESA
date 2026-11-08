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

test('validación: datos mal formados → 400 con mensaje claro', async () => {
  const pago = await s.api('POST', '/pagos', {
    token: admin, body: { id_cuenta: 1, monto_pago: 'abc', id_metodo_pago: idEfectivo },
  });
  assert.equal(pago.status, 400);
  assert.match(pago.body.message, /monto/i);

  const correo = await s.api('POST', '/matriculas', {
    token: admin,
    body: { ...nuevaMatricula('3001', '7001'), acudiente: { cedula: '7001', nombre: 'X', correo: 'no-es-correo' } },
  });
  assert.equal(correo.status, 400);
  assert.match(correo.body.message, /correo/i);

  const tarifa = await s.api('POST', '/pagos/tarifas', {
    token: admin, body: { year: 'dos mil', valor_pension: -5, valor_matricula: 1 },
  });
  assert.equal(tarifa.status, 400);
  assert.ok(tarifa.body.errors.length >= 2);

  assert.equal((await s.api('GET', '/pagos/matriculas/abc', { token: admin })).status, 400);
});

test('notas: el docente guarda notas, puesto y observaciones del periodo', async () => {
  const docente = await s.api('POST', '/docentes', {
    token: admin, body: { cedula: '9001', nombre: 'Profe Uno', jornada: 'MAÑANA', nombreGrado: 'Primero' },
  });
  assert.equal(docente.status, 201);
  const token = await s.login('9001', '9001');

  const { Materia } = s.modelos;
  const mate = await Materia.findOne({ where: { nombre: 'Matemáticas' } });
  const guardar = (extra) => s.api('POST', '/notas/estudiante-bulk', {
    token,
    body: { id_matricula: idMatricula, numero_periodo: 1, year: YEAR, ...extra },
  });

  const fuera = await guardar({ materias: [{ id_materia: mate.id_materia, nota: 11, fallas: 0 }] });
  assert.equal(fuera.status, 400);

  const ok = await guardar({
    materias: [{ id_materia: mate.id_materia, nota: 8.5, fallas: 2, intensidad_horaria: 4, observacion: null }],
    puesto: 3,
    observaciones: 'Buen desempeño en el periodo',
  });
  assert.equal(ok.status, 200);

  const leido = await s.api('GET', `/notas/estudiante/${idMatricula}?numero_periodo=1&year=${YEAR}`, { token });
  assert.equal(leido.status, 200);
  assert.equal(leido.body.data.puesto, 3);
  assert.equal(leido.body.data.observaciones, 'Buen desempeño en el periodo');
  const m = leido.body.data.materias.find((x) => x.id_materia === mate.id_materia);
  assert.equal(m.nota, 8.5);
  assert.equal(m.fallas, 2);

  // Solo observaciones (sin materias cambiadas) también se guarda
  await guardar({ materias: [], observaciones: 'Actualizada' });
  const otra = await s.api('GET', `/notas/estudiante/${idMatricula}?numero_periodo=1&year=${YEAR}`, { token });
  assert.equal(otra.body.data.observaciones, 'Actualizada');
  assert.equal(otra.body.data.puesto, 3);
});
