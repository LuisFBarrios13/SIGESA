// tests/gestion-matriculas.test.js
// Rematricular, retirar/reactivar y restablecer contraseñas.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor } from './helpers/servidor.js';

const YEAR = new Date().getFullYear();
const MES  = new Date().getMonth() + 1;

let s, admin, idPrimero, idSegundo, idMatricula;

before(async () => {
  s = await iniciarServidor();
  await s.crearUsuario('admin', 'clave123', 'ADMINISTRADOR');
  admin = await s.login('admin', 'clave123');

  const { Grado } = s.modelos;
  idPrimero = (await Grado.findOne({ where: { nombre: 'Primero', jornada: 'MAÑANA' } })).id_grado;
  idSegundo = (await Grado.findOne({ where: { nombre: 'Segundo', jornada: 'TARDE' } })).id_grado;

  const m = await s.api('POST', '/matriculas', {
    token: admin,
    body: {
      estudiante: { numero_identidad: '1001', nombre: 'Ana Pérez', fecha_nacimiento: '2019-03-10' },
      matricula:  { id_grado: idPrimero, year: YEAR, jornada: 'MAÑANA' },
      acudiente:  { cedula: '5001', nombre: 'Rosa Pérez' },
    },
  });
  idMatricula = m.body.data.matricula.id_matricula;

  await s.api('POST', '/pagos/tarifas', { token: admin, body: { year: YEAR, valor_pension: 100000, valor_matricula: 150000 } });
  await s.api('POST', '/pagos/cuentas/pension', { token: admin, body: { id_matricula: idMatricula, year: YEAR } });
});
after(() => s?.cerrar());

test('rematricular: año siguiente en otro grado; la jornada sale del grado', async () => {
  const r = await s.api('POST', '/matriculas/rematricula', {
    token: admin, body: { id_estudiante: '1001', id_grado: idSegundo, year: YEAR + 1 },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.year, YEAR + 1);
  assert.equal(r.body.data.jornada, 'TARDE');
  assert.equal(r.body.data.grado.nombre, 'Segundo');

  // El acudiente ve ambas matrículas de su hijo
  const token = await s.login('1001', '1001');
  const perfil = await s.api('GET', '/acudiente/mis-estudiantes', { token });
  assert.equal(perfil.body.data.estudiantes[0].matriculas.length, 2);
});

test('rematricular: un año ya matriculado → 409; estudiante inexistente → 404', async () => {
  const repetido = await s.api('POST', '/matriculas/rematricula', {
    token: admin, body: { id_estudiante: '1001', id_grado: idPrimero, year: YEAR },
  });
  assert.equal(repetido.status, 409);
  assert.match(repetido.body.message, /ya tiene una matrícula/);

  const noExiste = await s.api('POST', '/matriculas/rematricula', {
    token: admin, body: { id_estudiante: '9999', id_grado: idPrimero, year: YEAR },
  });
  assert.equal(noExiste.status, 404);
});

test('retirar: borra solo las pensiones futuras sin pagos; reactivar lo deshace', async () => {
  const { CuentaCobro, MetodoPago } = s.modelos;

  // Un pago en la pensión de noviembre: aunque sea futura, debe conservarse
  const noviembre = await CuentaCobro.findOne({ where: { id_matricula: idMatricula, mes: 11 } });
  const efectivo  = await MetodoPago.findOne({ where: { nombre: 'EFECTIVO' } });
  await s.api('POST', '/pagos', {
    token: admin, body: { id_cuenta: noviembre.id_cuenta, monto_pago: 1000, id_metodo_pago: efectivo.id_metodo },
  });

  const futurasSinPago = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter((m) => m > MES).length;
  const retiro = await s.api('PATCH', `/matriculas/${idMatricula}/estado`, { token: admin, body: { estado: 'RETIRADO' } });
  assert.equal(retiro.status, 200);
  assert.equal(retiro.body.data.matricula.estado, 'RETIRADO');
  assert.equal(retiro.body.data.cuentasEliminadas, futurasSinPago);
  assert.ok(await CuentaCobro.findByPk(noviembre.id_cuenta), 'la cuenta con pago se conserva');

  const otraVez = await s.api('PATCH', `/matriculas/${idMatricula}/estado`, { token: admin, body: { estado: 'RETIRADO' } });
  assert.equal(otraVez.status, 400);

  const reactivar = await s.api('PATCH', `/matriculas/${idMatricula}/estado`, { token: admin, body: { estado: 'ACTIVO' } });
  assert.equal(reactivar.status, 200);
  // Las pensiones que falten se pueden volver a generar
  const regenerar = await s.api('POST', '/pagos/cuentas/pension', { token: admin, body: { id_matricula: idMatricula, year: YEAR } });
  assert.equal(regenerar.body.data.creadas.length, futurasSinPago);

  const invalido = await s.api('PATCH', `/matriculas/${idMatricula}/estado`, { token: admin, body: { estado: 'GRADUADO' } });
  assert.equal(invalido.status, 400);
});

test('restablecer contraseña de docente y de acudiente', async () => {
  // Docente que ya cambió su contraseña
  await s.api('POST', '/docentes', {
    token: admin, body: { cedula: '9001', nombre: 'Profe Uno', jornada: 'MAÑANA', nombreGrado: 'Tercero' },
  });
  const tDoc = await s.login('9001', '9001');
  await s.api('PATCH', '/auth/change-password', { token: tDoc, body: { newPassword: 'olvidada1' } });

  const rDoc = await s.api('POST', '/docentes/9001/restablecer-clave', { token: admin });
  assert.equal(rDoc.status, 200);
  assert.deepEqual([rDoc.body.data.username, rDoc.body.data.passwordTemporal], ['9001', '9001']);
  const loginDoc = await s.api('POST', '/auth/login', { body: { username: '9001', password: '9001' } });
  assert.equal(loginDoc.status, 200);
  assert.equal(loginDoc.body.data.user.primerLogin, true);

  // Acudiente: su usuario es el documento del primer estudiante
  const rAcu = await s.api('POST', '/acudientes/5001/restablecer-clave', { token: admin });
  assert.equal(rAcu.status, 200);
  assert.equal(rAcu.body.data.username, '1001');

  assert.equal((await s.api('POST', '/docentes/0000/restablecer-clave', { token: admin })).status, 404);
  // Solo el administrador puede hacerlo
  assert.equal((await s.api('POST', '/acudientes/5001/restablecer-clave', { token: tDoc })).status, 403);
});

test('no se restablece la contraseña de un administrador', async () => {
  const { Usuario, Rol, UsuarioRol, Docente } = s.modelos;
  const usuario = await Usuario.findOne({ where: { username: 'admin' } });
  const rolDoc  = await Rol.findOne({ where: { nombre: 'DOCENTE' } });
  await UsuarioRol.create({ id_usuario: usuario.id_usuario, id_rol: rolDoc.id_rol });
  await Docente.create({ cedula: '7777', nombre: 'Rector', jornada: 'MAÑANA', id_usuario: usuario.id_usuario });

  const r = await s.api('POST', '/docentes/7777/restablecer-clave', { token: admin });
  assert.equal(r.status, 403);
});
