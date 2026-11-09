// src/components/ds/tonos.ts
// Tonos de color del diseño SIGESA, compartidos por StatCard, EstadoBadge y ProgressBar.

export type Tono = 'vino' | 'verde' | 'dorado' | 'rojo' | 'azul' | 'tinta' | 'neutro' | 'alerta';

/** Círculo de ícono / color sólido. */
export const TONO_SOLIDO: Record<Tono, string> = {
  vino:   'bg-vino text-white',
  verde:  'bg-verde text-white',
  dorado: 'bg-dorado text-[#3D2C00]',
  rojo:   'bg-rojo text-white',
  azul:   'bg-azul text-white',
  tinta:  'bg-tinta text-white',
  neutro: 'bg-linea text-tinta-media',
  /** Círculo rojo suave con ícono rojo (deudas). */
  alerta: 'bg-rojo-suave text-rojo',
};

/** Fondo suave + texto oscuro (chips y badges). Contraste ≥ 4.5:1. */
export const TONO_SUAVE: Record<Tono, string> = {
  vino:   'bg-vino-suave text-vino',
  verde:  'bg-verde-suave text-verde-texto',
  dorado: 'bg-dorado-suave text-dorado-texto',
  rojo:   'bg-rojo-suave text-rojo',
  azul:   'bg-azul-suave text-azul-texto',
  tinta:  'bg-linea text-tinta',
  neutro: 'bg-[#EFECE9] text-tinta-media',
  alerta: 'bg-rojo-suave text-rojo',
};

/** Relleno de barras de progreso. */
export const TONO_BARRA: Record<Tono, string> = {
  vino:   'bg-vino',
  verde:  'bg-verde',
  dorado: 'bg-dorado',
  rojo:   'bg-rojo',
  azul:   'bg-azul',
  tinta:  'bg-tinta',
  neutro: 'bg-tinta-suave',
  alerta: 'bg-rojo',
};

/** Estados del sistema → tono y texto que se muestra. */
export const ESTADOS: Record<string, { tono: Tono; texto: string }> = {
  PAGADO:    { tono: 'verde',  texto: 'Pagado' },
  PENDIENTE: { tono: 'dorado', texto: 'Pendiente' },
  VENCIDO:   { tono: 'rojo',   texto: 'Vencido' },
  ACTIVO:    { tono: 'verde',  texto: 'Activo' },
  RETIRADO:  { tono: 'rojo',   texto: 'Retirado' },
  GRADUADO:  { tono: 'neutro', texto: 'Graduado' },
  MAÑANA:    { tono: 'dorado', texto: 'Mañana' },
  TARDE:     { tono: 'azul',   texto: 'Tarde' },
  COMPLETA:  { tono: 'verde',  texto: 'Completa' },
};
