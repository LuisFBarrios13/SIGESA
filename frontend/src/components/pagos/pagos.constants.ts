// src/components/pagos/pagos.constants.ts
import type { EstadoCuenta } from '../../services/pagosApi';

export const NOMBRE_MES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

export const ESTADO_META: Record<EstadoCuenta, {
  label: string; icon: string; bg: string; text: string; border: string;
}> = {
  PENDIENTE: { label: 'Pendiente', icon: 'schedule',     bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  PAGADO:    { label: 'Pagado',    icon: 'check_circle', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  VENCIDO:   { label: 'Vencido',   icon: 'cancel',       bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
};

export const CONCEPTO_META: Record<string, { icon: string; bg: string; text: string }> = {
  'MATRÍCULA': { icon: 'how_to_reg', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  'PENSIÓN':   { icon: 'payments',   bg: 'bg-purple-100', text: 'text-purple-700' },
};

export const METODO_ICONS: Record<string, string> = {
  EFECTIVO:      'payments',
  TRANSFERENCIA: 'swap_horiz',
  CONSIGNACIÓN:  'account_balance',
  TARJETA:       'credit_card',
};

export const yearOptions = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - 1 + i,
);

export const fmt = (n: number | string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n));