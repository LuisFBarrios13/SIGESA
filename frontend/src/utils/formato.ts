// src/utils/formato.ts — textos de dinero, fechas y nombres en español de Colombia.

const decimal = (n: number, max = 1) =>
  n.toLocaleString('es-CO', { maximumFractionDigits: max });

/** Dinero corto: $45,2 M · $980 mil · $500 */
export function dineroCorto(valor: number): string {
  const v = Math.abs(valor);
  if (v >= 1_000_000) return `$${decimal(valor / 1_000_000)} M`;
  if (v >= 1_000) return `$${decimal(Math.round(valor / 1_000), 0)} mil`;
  return `$${decimal(valor, 0)}`;
}

/** Documento con puntos de miles: 1034567210 → 1.034.567.210 (si es solo números). */
export function documento(doc: string): string {
  return /^\d+$/.test(doc) ? Number(doc).toLocaleString('es-CO') : doc;
}

/** Iniciales de un nombre: "Juan Esteban Mora" → "JM" */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const primera = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primera + ultima).toUpperCase();
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "DOMINGO · 15 DE NOVIEMBRE" */
export function fechaEncabezado(d = new Date()): string {
  return `${DIAS[d.getDay()]} · ${d.getDate()} de ${MESES_LARGOS[d.getMonth()]}`.toUpperCase();
}

/** Saludo según la hora del día. */
export function saludo(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** "abril, junio y octubre" */
export function listaY(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/** "Primero · Mañana" */
export function nombreGrado(nombre: string, jornada: string): string {
  return `${nombre} · ${jornada === 'TARDE' ? 'Tarde' : 'Mañana'}`;
}
