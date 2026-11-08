// scripts/seedAdmin.js
// Crea el usuario administrador inicial (admin / admin123) si no existe.
// Antes aplica las migraciones pendientes, así que sirve en una base vacía.
// Ejecutar: npm run seed:admin
import bcrypt from 'bcryptjs';
import { sequelize, connectDB } from '../src/config/database.js';
import { migrarPendientes } from '../src/config/migrator.js';
import { Usuario, Rol, UsuarioRol } from '../src/models/index.js';
import { ROLES } from '../src/constants/roles.js';

const USERNAME = 'admin';
const PASSWORD = 'admin123'; // temporal: se pide cambiarla en el primer login

const seedAdmin = async () => {
  await connectDB();
  sequelize.options.logging = false;
  await migrarPendientes();

  if (await Usuario.findOne({ where: { username: USERNAME } })) {
    console.log(`⚠️  El usuario "${USERNAME}" ya existe; no se cambió nada.`);
    return;
  }

  const rolAdmin = await Rol.findOne({ where: { nombre: ROLES.ADMINISTRADOR } });
  await sequelize.transaction(async (transaction) => {
    const usuario = await Usuario.create({
      username:     USERNAME,
      nombre:       'Administrador',
      password:     await bcrypt.hash(PASSWORD, 10),
      estado:       true,
      primer_login: true,
    }, { transaction });
    await UsuarioRol.create({ id_usuario: usuario.id_usuario, id_rol: rolAdmin.id_rol }, { transaction });
  });

  console.log(`✅ Administrador creado → usuario: ${USERNAME} | contraseña temporal: ${PASSWORD}`);
  console.log('   Deberá cambiar la contraseña en el primer inicio de sesión.');
};

seedAdmin()
  .then(() => sequelize.close())
  .catch((err) => {
    console.error('❌ Error durante el seed:', err.message);
    process.exit(1);
  });
