// tests/auth.test.js — inicio de sesión, cambio de contraseña y permisos por rol
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor } from './helpers/servidor.js';

let s;
before(async () => {
  s = await iniciarServidor();
  await s.crearUsuario('admin', 'clave123', 'ADMINISTRADOR', { nombre: 'Rectoría' });
  await s.crearUsuario('nuevo', 'temporal1', 'ACUDIENTE', { primer_login: true });
  await s.crearUsuario('profe', 'clave123', 'DOCENTE');
  await s.crearUsuario('inactivo', 'clave123', 'ADMINISTRADOR', { estado: false });
});
after(() => s?.cerrar());

test('login correcto devuelve token, roles y nombre', async () => {
  const { status, body } = await s.api('POST', '/auth/login', { body: { username: 'admin', password: 'clave123' } });
  assert.equal(status, 200);
  assert.ok(body.data.token);
  assert.deepEqual(body.data.user.roles, ['ADMINISTRADOR']);
  assert.equal(body.data.user.nombre, 'Rectoría'); // columna usuarios.nombre
  assert.equal(body.data.user.primerLogin, false);
});

test('contraseña incorrecta → 401', async () => {
  const { status } = await s.api('POST', '/auth/login', { body: { username: 'admin', password: 'mala' } });
  assert.equal(status, 401);
});

test('usuario inexistente o inactivo → 401 con el mismo mensaje', async () => {
  const a = await s.api('POST', '/auth/login', { body: { username: 'nadie',    password: 'clave123' } });
  const b = await s.api('POST', '/auth/login', { body: { username: 'inactivo', password: 'clave123' } });
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.equal(a.body.message, b.body.message);
});

test('primer login: cambiar la contraseña la reemplaza y quita la marca', async () => {
  const primero = await s.api('POST', '/auth/login', { body: { username: 'nuevo', password: 'temporal1' } });
  assert.equal(primero.body.data.user.primerLogin, true);
  const token = primero.body.data.token;

  const corta = await s.api('PATCH', '/auth/change-password', { token, body: { newPassword: '123' } });
  assert.equal(corta.status, 400);

  const ok = await s.api('PATCH', '/auth/change-password', { token, body: { newPassword: 'nueva456' } });
  assert.equal(ok.status, 200);

  const vieja = await s.api('POST', '/auth/login', { body: { username: 'nuevo', password: 'temporal1' } });
  assert.equal(vieja.status, 401);
  const nueva = await s.api('POST', '/auth/login', { body: { username: 'nuevo', password: 'nueva456' } });
  assert.equal(nueva.status, 200);
  assert.equal(nueva.body.data.user.primerLogin, false);
});

test('sin token o con token inválido → 401', async () => {
  assert.equal((await s.api('GET', '/matriculas')).status, 401);
  assert.equal((await s.api('GET', '/matriculas', { token: 'basura' })).status, 401);
});

test('cada rol solo entra a sus rutas', async () => {
  const admin     = await s.login('admin', 'clave123');
  const docente   = await s.login('profe', 'clave123');
  const acudiente = await s.login('nuevo', 'nueva456');

  // Administrador
  assert.equal((await s.api('GET', '/matriculas',    { token: admin })).status, 200);
  assert.equal((await s.api('GET', '/pagos/metodos', { token: admin })).status, 200);
  assert.equal((await s.api('GET', '/acudiente/mis-estudiantes', { token: admin })).status, 403);
  assert.equal((await s.api('GET', '/docente/perfil',            { token: admin })).status, 403);

  // Docente
  assert.equal((await s.api('GET', '/matriculas',    { token: docente })).status, 403);
  assert.equal((await s.api('GET', '/pagos/metodos', { token: docente })).status, 403);

  // Acudiente
  assert.equal((await s.api('GET', '/matriculas',     { token: acudiente })).status, 403);
  assert.equal((await s.api('GET', '/pagos/metodos',  { token: acudiente })).status, 403);
  assert.equal((await s.api('GET', '/docente/perfil', { token: acudiente })).status, 403);
});

test('errores: JSON mal formado → 400 y ruta inexistente → 404', async () => {
  const res = await fetch(s.url + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{ esto no es json',
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).success, false);
  assert.equal((await s.api('GET', '/no-existe')).status, 404);
});
