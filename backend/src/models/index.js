// src/models/index.js

// ── Importar todos los modelos ────────────────────────────────
import { Rol }           from '../usuarios/rol.model.js';
import { Usuario }       from '../usuarios/usuario.model.js';
import { UsuarioRol }    from '../usuarios/usuario_rol.model.js';
import { Acudiente }     from '../acudientes/acudiente.model.js';
import { Docente }       from '../docentes/docente.model.js';
import { Estudiante }    from '../estudiantes/estudiante.model.js';
import { RelacionEA }    from '../estudiantes/relacion_ea.model.js';
import { Matricula }     from '../estudiantes/matricula.model.js';
import { Grado }         from '../grados/grado.model.js';
import { Periodo }       from '../periodos/periodo.model.js';
import { ConceptoPago }  from '../pagos/concepto_pago.model.js';
import { MetodoPago }    from '../pagos/metodo_pago.model.js';
import { CuentaCobro }   from '../pagos/cuenta_cobro.model.js';
import { Pago }          from '../pagos/pago.model.js';
import { Materia }       from '../notas/materia.model.js';
import { Nota }          from '../notas/nota.model.js';

// ── Asociaciones Usuario ──────────────────────────────────────
// Un usuario tiene muchos roles (a través de UsuarioRol)
Usuario.belongsToMany(Rol, {
  through: UsuarioRol,
  foreignKey: 'id_usuario',
  otherKey: 'id_rol',
  as: 'roles',
});
Rol.belongsToMany(Usuario, {
  through: UsuarioRol,
  foreignKey: 'id_rol',
  otherKey: 'id_usuario',
  as: 'usuarios',
});

// ── Asociaciones Acudiente ────────────────────────────────────
// Un acudiente pertenece a un usuario (para login)
Acudiente.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Usuario.hasOne(Acudiente, { foreignKey: 'id_usuario', as: 'acudiente' });

// ── Asociaciones Docente ──────────────────────────────────────
Docente.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Usuario.hasOne(Docente, { foreignKey: 'id_usuario', as: 'docente' });

// ── Asociaciones Grado ────────────────────────────────────────
Grado.belongsTo(Docente, { foreignKey: 'id_docente', as: 'docente' });
Docente.hasMany(Grado, { foreignKey: 'id_docente', as: 'grados' });

// ── Asociaciones Estudiante ───────────────────────────────────
// Un estudiante tiene muchos acudientes (a través de RelacionEA)
Estudiante.belongsToMany(Acudiente, {
  through: RelacionEA,
  foreignKey: 'id_estudiante',
  otherKey: 'id_acudiente',
  as: 'acudientes',
});
Acudiente.belongsToMany(Estudiante, {
  through: RelacionEA,
  foreignKey: 'id_acudiente',
  otherKey: 'id_estudiante',
  as: 'estudiantes',
});

// ── Asociaciones Matrícula ────────────────────────────────────
Matricula.belongsTo(Estudiante, { foreignKey: 'id_estudiante', as: 'estudiante' });
Matricula.belongsTo(Grado, { foreignKey: 'id_grado', as: 'grado' });
Estudiante.hasMany(Matricula, { foreignKey: 'id_estudiante', as: 'matriculas' });
Grado.hasMany(Matricula, { foreignKey: 'id_grado', as: 'matriculas' });

// ── Asociaciones Cuenta de cobro ──────────────────────────────
CuentaCobro.belongsTo(Matricula, { foreignKey: 'id_matricula', as: 'matricula' });
CuentaCobro.belongsTo(ConceptoPago, { foreignKey: 'id_concepto_pago', as: 'concepto' });
Matricula.hasMany(CuentaCobro, { foreignKey: 'id_matricula', as: 'cuentas' });

// ── Asociaciones Pago ─────────────────────────────────────────
Pago.belongsTo(CuentaCobro, { foreignKey: 'id_cuenta_cobro', as: 'cuenta' });
Pago.belongsTo(MetodoPago, { foreignKey: 'id_metodo_pago', as: 'metodo' });
CuentaCobro.hasMany(Pago, { foreignKey: 'id_cuenta_cobro', as: 'pagos' });

// ── Asociaciones Nota ─────────────────────────────────────────
Nota.belongsTo(Matricula, { foreignKey: 'id_matricula', as: 'matricula' });
Nota.belongsTo(Materia, { foreignKey: 'id_materia', as: 'materia' });
Nota.belongsTo(Periodo, { foreignKey: 'id_periodo', as: 'periodo' });
Matricula.hasMany(Nota, { foreignKey: 'id_matricula', as: 'notas' });

// ── Exportar todo ─────────────────────────────────────────────
export {
  Rol,
  Usuario,
  UsuarioRol,
  Acudiente,
  Docente,
  Estudiante,
  RelacionEA,
  Matricula,
  Grado,
  Periodo,
  ConceptoPago,
  MetodoPago,
  CuentaCobro,
  Pago,
  Materia,
  Nota,
};