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

/** "DOMINGO · 15 DE NOVIEMBRE" (con conYear: "… DE 2026") */
export function fechaEncabezado(d = new Date(), conYear = false): string {
  const texto = `${DIAS[d.getDay()]} · ${d.getDate()} de ${MESES_LARGOS[d.getMonth()]}${conYear ? ` de ${d.getFullYear()}` : ''}`;
  return texto.toUpperCase();
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

/** "2020-05-05" → "05 may 2020" (sin pasar por Date, así no cambia por la zona horaria). */
export function fechaDia(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, '0')} ${MESES_LARGOS[m - 1].slice(0, 3)} ${y}`;
}

/** Años cumplidos a partir de "AAAA-MM-DD". */
export function edad(iso: string | null | undefined, hoy = new Date()): number | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  let anos = hoy.getFullYear() - y;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) anos--;
  return anos;
}
