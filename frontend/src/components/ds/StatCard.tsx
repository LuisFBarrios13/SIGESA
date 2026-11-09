// src/components/ds/StatCard.tsx
// Tarjeta de indicador: ícono redondo, chip opcional, etiqueta y valor.
import type { ReactNode } from 'react';
import { TONO_SOLIDO, TONO_SUAVE, type Tono } from './tonos';

interface Props {
  icono:    string;   // nombre de Material Symbols
  etiqueta: string;
  valor:    ReactNode;
  tono?:    Tono;
  /** Chip arriba a la derecha (se oculta en pantallas muy pequeñas). */
  chip?:    string;
  chipTono?: Tono;
  /** Línea pequeña bajo el valor. */
  detalle?: string;
}

const StatCard = ({ icono, etiqueta, valor, tono = 'vino', chip, chipTono, detalle }: Props) => (
  <div className="bg-tarjeta rounded-[20px] sm:rounded-card p-4 sm:p-[22px] flex flex-col gap-3.5 sm:gap-5 min-w-0">
    <div className="flex justify-between items-start gap-2">
      <span aria-hidden="true"
        className={`w-[38px] h-[38px] sm:w-[46px] sm:h-[46px] rounded-full flex items-center justify-center shrink-0 ${TONO_SOLIDO[tono]}`}>
        <span className="material-symbols-outlined text-[19px] sm:text-[21px]">{icono}</span>
      </span>
      {chip && (
        <span className={`hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap
          ${TONO_SUAVE[chipTono ?? tono]}`}>
          {chip}
        </span>
      )}
    </div>
    <div className="flex flex-col gap-0.5 sm:gap-1.5 min-w-0">
      <span className="text-xs sm:text-sm text-tinta-suave">{etiqueta}</span>
      <span className={`text-lg sm:text-[26px] font-semibold tracking-tight leading-tight break-words ${tono === 'alerta' ? 'text-rojo' : ''}`}>{valor}</span>
      {detalle && <span className="text-xs sm:text-[13px] text-tinta-suave">{detalle}</span>}
    </div>
  </div>
);

export default StatCard;
