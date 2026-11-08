// scripts/usuariosPrueba.js
// SOLO PARA DESARROLLO / PRUEBAS.
//
//   node scripts/usuariosPrueba.js                 → lista usuarios con su rol y nombre
//   node scripts/usuariosPrueba.js --reset          → además pone a TODOS la contraseña "prueba123"
//   node scripts/usuariosPrueba.js --reset MiClave  → idem con la contraseña indicada
//
// Con --reset también se desactiva primer_login para entrar directo sin
// tener que cambiar la contraseña.
import bcrypt from 'bcryptjs';
import { sequelize, connectDB } from '../src/config/database.js';
import { env } from '../src/config/environment.js';
import { Usuario, Rol, Docente, Acudiente } from '../src/models/index.js';

const args     = process.argv.slice(2);
const reset    = args.includes('--reset');
const password = args[args.indexOf('--reset') + 1] ?? 'prueba123';

const main = async () => {
  if (env.nodeEnv === 'production') {
    console.error('❌ Este script no se puede ejecutar con NODE_ENV=production.');
    process.exit(1);
  }
  if (reset && password.length < 6) {
    console.error('❌ La contraseña debe tener al menos 6 caracteres.');
    process.exit(1);
  }

  await connectDB();
  sequelize.options.logging = false;

  const usuarios = await Usuario.findAll({
    include: [
      { model: Rol,       as: 'roles', through: { attributes: [] } },
      { model: Docente,   as: 'docente' },
      { model: Acudiente, as: 'acudiente' },
    ],
    order: [['id_usuario', 'ASC']],
  });

  if (reset) {
    const hash = await bcrypt.hash(password, 10);
    await Usuario.update(
      { password: hash, primer_login: false, estado: true },
      { where: {} },
    );
    console.log(`🔑 Contraseña de los ${usuarios.length} usuarios cambiada a: ${password}\n`);
  }

  console.table(usuarios.map((u) => ({
    id:       u.id_usuario,
    usuario:  u.username,
    rol:      u.roles.map((r) => r.nombre).join(', ') || '(sin rol)',
    nombre:   u.docente?.nombre ?? u.acudiente?.nombre ?? '',
    activo:   u.estado ? 'sí' : 'no',
  })));

  await sequelize.close();
};

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
