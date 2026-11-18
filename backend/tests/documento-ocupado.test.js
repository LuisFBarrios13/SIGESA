// tests/documento-ocupado.test.js
// Un estudiante nuevo no puede tener el documento de un docente, un acudiente u otra cuenta.
// Un docente sí puede ser acudiente.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor } from './helpers/servidor.js';

const YEAR = new Date().getFullYear();

let s, admin, idPrimero;

const matricular = (numero_identidad, cedula, nombreAcudiente = 'Acudiente Prueba') =>
  s.api('POST', '/matriculas', {
    token: admin,
    body: {
      estudiante: { numero_identidad, nombre: 'Estudiante Prueba', fecha_nacimiento: '2019-03-10' },
      matricula:  { id_grado: idPrimero, year: YEAR, jornada: 'MAÑANA' },
      acudiente:  { cedula, nombre: nombreAcudiente },
    },
  });

before(async () => {
  s = await iniciarServidor();
  await s.crearUsuario('admin', 'clave123', 'ADMINISTRADOR');
  admin = await s.login('admin', 'clave123');

  const { Grado, Docente } = s.modelos;
  idPrimero = (await Grado.findOne({ where: { nombre: 'Primero', jornada: 'MAÑANA' } })).id_grado;

  const u = await s.crearUsuario('7001', '7001', 'DOCENTE');
  await Docente.create({ cedula: '7001', nombre: 'Marta Gómez', telefono: '3001234567', correo: 'marta@colegio.edu.co', id_usuario: u.id_usuario });

  // Acudiente con cédula 5001 (su usuario es el documento del estudiante, 1001)
  await matricular('1001', '5001', 'Rosa Pérez');
});
after(() => s?.cerrar());

test('documento: dice de quién es (docente, acudiente, otra cuenta o nadie)', async () => {
  const docente = await s.api('GET', '/matriculas/documento/7001', { token: admin });
  assert.equal(docente.status, 200);
  assert.deepEqual(docente.body.data, { tipo: 'docente', nombre: 'Marta Gómez', telefono: '3001234567', correo: 'marta@colegio.edu.co' });

  const acudiente = await s.api('GET', '/matriculas/documento/5001', { token: admin });
  assert.equal(acudiente.body.data.tipo, 'acudiente');
  assert.equal(acudiente.body.data.nombre, 'Rosa Pérez');

  const cuenta = await s.api('GET', '/matriculas/documento/admin', { token: admin });
  assert.equal(cuenta.body.data.tipo, 'usuario');

  const nadie = await s.api('GET', '/matriculas/documento/8888', { token: admin });
  assert.equal(nadie.status, 200);
  assert.equal(nadie.body.data, null);
});

test('matricular: un estudiante con el documento de un docente o un acudiente → 409, sin dejar nada a medias', async () => {
  const conDocente = await matricular('7001', '5001');
  assert.equal(conDocente.status, 409);
  assert.match(conDocente.body.message, /docente Marta Gómez/);

  const conAcudiente = await matricular('5001', '6001');
  assert.equal(conAcudiente.status, 409);
  assert.match(conAcudiente.body.message, /acudiente Rosa Pérez/);

  const { Estudiante } = s.modelos;
  assert.equal(await Estudiante.findByPk('7001'), null);
  assert.equal(await Estudiante.findByPk('5001'), null);
});

test('matricular: la cédula del acudiente no puede ser el documento del estudiante', async () => {
  const r = await matricular('1002', '1002');
  assert.equal(r.status, 400);
});

test('matricular: un docente sí puede ser el acudiente', async () => {
  const r = await matricular('1003', '7001', 'Marta Gómez');
  assert.equal(r.status, 201);

  // Sigue entrando como docente con su cédula, y como acudiente con el documento del estudiante
  assert.ok(await s.login('7001', '7001'));
  assert.ok(await s.login('1003', '1003'));
});
