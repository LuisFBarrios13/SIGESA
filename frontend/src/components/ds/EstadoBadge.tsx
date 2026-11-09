// src/components/ds/EstadoBadge.tsx
// Píldora de estado: <EstadoBadge estado="PAGADO" /> o <EstadoBadge tono="vino">11 cuotas</EstadoBadge>
import type { ReactNode } from 'react';
import { ESTADOS, TONO_SUAVE, type Tono } from './tonos';

type Props =
  | { estado: string; tono?: never; children?: never; punto?: boolean; tamano?: 'sm' | 'md' }
  | { estado?: never; tono: Tono; children: ReactNode; punto?: boolean; tamano?: 'sm' | 'md' };

const EstadoBadge = ({ estado, tono, children, punto = false, tamano = 'sm' }: Props) => {
  const meta  = estado ? (ESTADOS[estado] ?? { tono: 'neutro' as Tono, texto: estado }) : null;
  const color = TONO_SUAVE[meta?.tono ?? tono ?? 'neutro'];

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-bold
      ${tamano === 'sm' ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-[13px]'} ${color}`}>
      {punto && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />}
      {meta ? meta.texto : children}
    </span>
  );
};

export default EstadoBadge;
