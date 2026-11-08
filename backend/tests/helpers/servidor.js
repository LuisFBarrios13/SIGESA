// tests/helpers/servidor.js
// Levanta la API contra una base de datos de pruebas recién creada.
// La base de desarrollo (DB_NAME del .env) nunca se toca.
import 'dotenv/config';
import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';

const BASE_DEV  = process.env.DB_NAME;
const BASE_TEST = process.env.DB_NAME_TEST || `${BASE_DEV}_test`;
if (!/^[a-z0-9_]+$/i.test(BASE_TEST) || BASE_TEST === BASE_DEV) {
  throw new Error(`Nombre de base de pruebas no válido: "${BASE_TEST}"`);
}

/** Borra y vuelve a crear la base de pruebas (conectándose a "postgres"). */
const recrearBase = async () => {
  const admin = new Sequelize('postgres', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging: false,
  });
  await admin.query(`DROP DATABASE IF EXISTS "${BASE_TEST}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${BASE_TEST}"`);
  await admin.close();
};

/**
 * Prepara una base limpia con migraciones y arranca la API en un puerto libre.
 * Devuelve helpers para crear usuarios y hacer peticiones.
 */
export const iniciarServidor = async () => {
  await recrearBase();
  process.env.DB_NAME  = BASE_TEST;
  process.env.NODE_ENV = 'test';

  // Importes dinámicos: deben leer el DB_NAME de pruebas.
  const { sequelize }        = await import('../../src/config/database.js');
  const { migrarPendientes } = await import('../../src/config/migrator.js');
  const modelos              = await import('../../src/models/index.js');
  const { default: app }     = await import('../../src/config/app.js');

  sequelize.options.logging = false;
  await migrarPendientes();

  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const url = `http://127.0.0.1:${server.address().port}/api`;

  /** fetch con JSON; devuelve { status, body }. */
  const api = async (metodo, ruta, { token, body } = {}) => {
    const res = await fetch(url + ruta, {
      method:  metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
  };

  /** Crea un usuario con el rol indicado. */
  const crearUsuario = async (username, password, rol, extra = {}) => {
    const { Usuario, Rol, UsuarioRol } = modelos;
    const usuario = await Usuario.create({
      username,
      password: await bcrypt.hash(password, 4),
      estado: true,
      primer_login: false,
      ...extra,
    });
    const r = await Rol.findOne({ where: { nombre: rol } });
    await UsuarioRol.create({ id_usuario: usuario.id_usuario, id_rol: r.id_rol });
    return usuario;
  };

  /** Inicia sesión y devuelve el token. */
  const login = async (username, password) => {
    const { status, body } = await api('POST', '/auth/login', { body: { username, password } });
    if (status !== 200) throw new Error(`Login de ${username} falló: ${status} ${body.message}`);
    return body.data.token;
  };

  const cerrar = async () => {
    await new Promise((r) => server.close(r));
    await sequelize.close();
  };

  return { api, crearUsuario, login, cerrar, modelos };
};
