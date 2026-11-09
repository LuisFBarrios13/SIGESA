// tests/editar-datos.test.js
// Editar docentes, acudientes y estudiantes: un opcional vacío borra el dato.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor } from './helpers/servidor.js';

const YEAR = new Date().getFullYear();
let s, admin;

before(async () => {
  s = await iniciarServidor();
  await s.crearUsuario('admin', 'clave123', 'ADMINISTRADOR');
  admin = await s.login('admin', 'clave123');

  const { Grado } = s.modelos;
  const primero = await Grado.findOne({ where: { nombre: 'Primero', jornada: 'MAÑANA' } });

  await s.api('POST', '/matriculas', {
    token: admin,
    body: {
      estudiante: {
        numero_identidad: '2001', nombre: 'Luis Gómez', fecha_nacimiento: '2019-05-01',
        rh: 'O+', direccion: 'Calle 1', observaciones: 'Alergia al maní',
      },
      matricula: { id_grado: primero.id_grado, year: YEAR, jornada: 'MAÑANA' },
      acudiente: { cedula: '6001', nombre: 'Marta Gómez', telefono: '3001112233', correo: 'marta@correo.com', direccion: 'Calle 1' },
    },
  });

  const d = await s.api('POST', '/docentes', {
    token: admin,
    body: { cedula: '7001', nombre: 'Pedro Ruiz', telefono: '3104445566', correo: 'pedro@correo.com', jornada: 'TARDE', nombreGrado: 'Segundo' },
  });
  assert.equal(d.status, 201, JSON.stringify(d.body));
});
after(() => s?.cerrar());

test('docente: vaciar teléfono y correo los borra', async () => {
  const r = await s.api('PATCH', '/docentes/7001', {
    token: admin, body: { nombre: 'Pedro Ruiz', telefono: '', correo: '' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.telefono, null);
  assert.equal(r.body.data.correo, null);
});

test('acudiente: vaciar opcionales los borra y conserva el resto', async () => {
  const r = await s.api('PATCH', '/acudientes/6001', {
    token: admin,
    body: { nombre: 'Marta Gómez', telefono: '', correo: '', direccion: 'Calle 2', telefono_trabajo: '', direccion_trabajo: '' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.telefono, null);
  assert.equal(r.body.data.correo, null);
  assert.equal(r.body.data.direccion, 'Calle 2');
});

test('estudiante: vaciar rh, dirección y observaciones los borra', async () => {
  const r = await s.api('PATCH', '/estudiantes/2001', {
    token: admin,
    body: { nombre: 'Luis Gómez', fecha_nacimiento: '2019-05-01', rh: '', direccion: '  ', observaciones: '' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.rh, null);
  assert.equal(r.body.data.direccion, null);
  assert.equal(r.body.data.observaciones, null);
});
