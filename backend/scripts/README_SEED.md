# Crear Usuario Administrador

## Opción 1: Usando el Script de Seed (Recomendado)

Este es el método más simple y seguro. El script hará todo automáticamente:

### Paso 1: Instala las dependencias si aún no lo has hecho
```bash
npm install
```

### Paso 2: Ejecuta el script de seed
```bash
node scripts/seedAdmin.js
```

### Resultado esperado:
```
🔄 Conectando a la base de datos...
✅ Conexión a PostgreSQL establecida correctamente.
🔄 Sincronizando modelos...
🔄 Verificando roles...
✅ Rol ADMINISTRADOR ya existe
🔄 Verificando usuario admin...
📝 Creando usuario administrador...
✅ Usuario administrador creado
   📧 Usuario: admin
   🔐 Contraseña temporal: admin123
   ⚠️  Deberá cambiar la contraseña en el primer login
🔄 Asignando rol...
✅ Rol ADMINISTRADOR asignado al usuario

✅ ¡Seed completado exitosamente!
```

### Credenciales de acceso:
- **Usuario:** `admin`
- **Contraseña temporal:** `admin123`
- **Nota:** El sistema te pedirá cambiar la contraseña en el primer login

---

## Opción 2: SQL Directo (Si prefieres)

Si quieres hacer todo manualmente desde tu cliente PostgreSQL:

```sql
-- 1. Crear el rol si no existe
INSERT INTO roles (nombre) VALUES ('ADMINISTRADOR')
ON CONFLICT (nombre) DO NOTHING;

-- 2. Obtener el ID del rol ADMINISTRADOR
SELECT id_rol FROM roles WHERE nombre = 'ADMINISTRADOR';

-- 3. Crear el usuario (usa bcrypt para hashear 'admin123' con salt 10)
-- La contraseña hasheada de 'admin123' es:
-- $2a$10$Ksq5XuDbVvvAzpHPjqcv2eYYjU.aHWQP0xgKBLcDz5QNwF5nKJJUO

INSERT INTO usuarios (username, password, estado, primer_login, fecha_creacion) 
VALUES ('admin', '$2a$10$Ksq5XuDbVvvAzpHPjqcv2eYYjU.aHWQP0xgKBLcDz5QNwF5nKJJUO', true, true, NOW());

-- 4. Obtener el ID del usuario creado
SELECT id_usuario FROM usuarios WHERE username = 'admin';

-- 5. Asignar el rol al usuario
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (1, 1);
-- (Reemplaza 1, 1 con los IDs reales)
```

---

## Cambiar la Contraseña Temporal

Una vez que inices sesión con `admin` / `admin123`, el sistema te redirigirá automáticamente a cambiar la contraseña por una más segura.

## ¿Quieres cambiar el usuario o contraseña?

Puedes editar el archivo `scripts/seedAdmin.js` y cambiar:
- Línea 39: `username: 'admin'` → `username: 'tu_usuario'`
- Línea 40: `const password = 'admin123'` → `const password = 'tu_contraseña'`

Luego ejecuta nuevamente el script.
