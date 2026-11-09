# SIGESA — Backend

API REST (Express 5 + Sequelize + PostgreSQL).

## Puesta en marcha

1. Copia `.env.example` a `.env` y completa los datos de PostgreSQL y `JWT_SECRET`.
2. `npm install`
3. `npm run seed:admin` — aplica las migraciones y crea el usuario `admin` / `admin123`
   (pide cambiar la contraseña en el primer inicio de sesión).
4. `npm run dev`

## Base de datos: migraciones

El esquema ya **no** se crea con `sequelize.sync()`. Cada cambio de tablas es un
archivo en `migrations/` con `up()` y `down()`; las aplicadas quedan en la tabla
`SequelizeMeta`. Al arrancar, el servidor aplica las pendientes.

| Comando | Qué hace |
|---|---|
| `npm run migrate` | Aplica las migraciones pendientes |
| `npm run migrate:status` | Muestra aplicadas (✅) y pendientes (⏳) |
| `npm run migrate:undo` | Revierte la última |

Para cambiar el esquema: modifica el modelo **y** crea una migración nueva
(`migrations/AAAAMMDD-NN-descripcion.js`) con el mismo cambio. Nunca edites una
migración que ya se aplicó.

Los datos fijos (roles, métodos de pago, grados y materias) los crea la
migración `20261108-03-catalogos.js`.

## Tests

`npm test` — pruebas de la API con `node:test`. Usan una base aparte
(`<DB_NAME>_test`, o `DB_NAME_TEST` si la defines) que se borra y se vuelve a
crear en cada ejecución; tu base de desarrollo no se toca.

## Producción

- `NODE_ENV=production`, un `JWT_SECRET` largo y aleatorio, y `CORS_ORIGIN` con
  el dominio del frontend (vacío = cualquier origen).
- `TRUST_PROXY=true` si la API está detrás de un proxy (Nginx, Render, Railway…);
  sin eso el límite de intentos de login vería a todos con la misma IP.
- Seguridad incluida: cabeceras con `helmet`, máximo 10 intentos fallidos de
  login por IP cada 15 minutos, validación de entrada en todas las rutas y
  errores 500 sin detalles internos.

## Solo para desarrollo

`node scripts/usuariosPrueba.js` lista los usuarios; con `--reset` les pone a
todos la contraseña `prueba123`.
