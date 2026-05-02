// scripts/seedAdmin.js
import bcrypt from 'bcryptjs';
import { sequelize, connectDB } from '../src/config/database.js';
import { Usuario, Rol, UsuarioRol } from '../src/models/index.js';

const seedAdmin = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await connectDB();

    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync();

    // Crear el rol ADMINISTRADOR si no existe
    console.log('🔄 Verificando roles...');
    let rolAdmin = await Rol.findOne({ where: { nombre: 'ADMINISTRADOR' } });
    
    if (!rolAdmin) {
      console.log('📝 Creando rol ADMINISTRADOR...');
      rolAdmin = await Rol.create({ nombre: 'ADMINISTRADOR' });
      console.log('✅ Rol ADMINISTRADOR creado');
    } else {
      console.log('✅ Rol ADMINISTRADOR ya existe');
    }

    // Crear el usuario admin
    console.log('🔄 Verificando usuario admin...');
    let usuarioAdmin = await Usuario.findOne({ where: { username: 'admin' } });

    if (!usuarioAdmin) {
      console.log('📝 Creando usuario administrador...');
      
      // Hashear la contraseña
      const password = 'admin123'; // Cambiar después del primer login
      const hashedPassword = await bcrypt.hash(password, 10);

      usuarioAdmin = await Usuario.create({
        username: 'admin',
        password: hashedPassword,
        estado: true,
        primer_login: true, // Fuerza cambiar contraseña en primer login
      });

      console.log('✅ Usuario administrador creado');
      console.log(`   📧 Usuario: admin`);
      console.log(`   🔐 Contraseña temporal: admin123`);
      console.log(`   ⚠️  Deberá cambiar la contraseña en el primer login`);

      // Asignar el rol ADMINISTRADOR al usuario
      console.log('🔄 Asignando rol...');
      await UsuarioRol.create({
        id_usuario: usuarioAdmin.id_usuario,
        id_rol: rolAdmin.id_rol,
      });

      console.log('✅ Rol ADMINISTRADOR asignado al usuario');
    } else {
      console.log('⚠️  El usuario admin ya existe');
    }

    console.log('\n✅ ¡Seed completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
