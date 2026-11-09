// src/components/ds/Controles.tsx
// Controles en forma de píldora blanca, como en el boceto: selector con
// etiqueta, botón redondo de ícono y botón con texto.
import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { iniciales } from '../../utils/iniciales';
import { TONO_SUAVE, type Tono } from './tonos';

export const Icono = ({ nombre, className = '' }: { nombre: string; className?: string }) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>{nombre}</span>
);

interface SelectPillProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  opciones: { valor: string | number; texto: string }[];
}

/** «Año [2026 ▾]» dentro de una píldora blanca. */
export const SelectPill = ({ etiqueta, opciones, className = '', ...props }: SelectPillProps) => (
  <label className={`inline-flex items-center gap-2 min-h-[52px] pl-[18px] pr-3 rounded-full bg-tarjeta
    text-sm text-tinta-suave ${className}`}>
    {etiqueta}
    <select {...props}
      className="bg-transparent text-sm font-semibold text-tinta cursor-pointer focus:outline-none
        focus-visible:ring-2 focus-visible:ring-vino/30 rounded-md py-1">
      {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
    </select>
  </label>
);

/** Botón redondo blanco con solo ícono (requiere etiqueta accesible). */
export const BotonIcono = ({ icono, etiqueta, className = '', ...props }:
  { icono: string; etiqueta: string } & ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" aria-label={etiqueta} title={etiqueta} {...props}
    className={`w-[52px] h-[52px] shrink-0 rounded-full bg-tarjeta text-tinta-media flex items-center justify-center
      hover:text-vino transition-colors disabled:opacity-50 ${className}`}>
    <Icono nombre={icono} className="text-[21px]" />
  </button>
);

type Variante = 'blanco' | 'vino' | 'tinta' | 'suave';
const VARIANTE: Record<Variante, string> = {
  blanco: 'bg-tarjeta text-tinta-media hover:text-tinta',
  vino:   'bg-vino text-white hover:bg-vino-hover',
  tinta:  'bg-tinta text-white hover:bg-tinta/90',
  suave:  'bg-crema text-tinta-media hover:bg-linea',
};

/** Botón con texto (y opcionalmente ícono). */
export const Boton = ({ icono, variante = 'blanco', children, className = '', ...props }:
  { icono?: string; variante?: Variante; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" {...props}
    className={`inline-flex items-center justify-center gap-2 min-h-11 px-[18px] rounded-xl text-sm font-semibold
      transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTE[variante]} ${className}`}>
    {icono && <Icono nombre={icono} className="text-[19px]" />}
    {children}
  </button>
);

/** Círculo con las iniciales. */
export const Avatar = ({ nombre, tono = 'vino', tamano = 40 }: { nombre: string; tono?: Tono; tamano?: number }) => (
  <span aria-hidden="true" style={{ width: tamano, height: tamano }}
    className={`rounded-full shrink-0 flex items-center justify-center text-[13px] font-semibold ${TONO_SUAVE[tono]}`}>
    {iniciales(nombre)}
  </span>
);

/** Campo de búsqueda en píldora blanca. */
export const Buscador = ({ valor, onCambio, placeholder, etiqueta, className = '' }: {
  valor: string; onCambio: (v: string) => void; placeholder: string; etiqueta: string; className?: string;
}) => (
  <label className={`flex items-center gap-2.5 min-h-[52px] px-4 rounded-2xl bg-tarjeta text-tinta-suave ${className}`}>
    <Icono nombre="search" className="text-xl" />
    <input type="search" value={valor} onChange={(e) => onCambio(e.target.value)}
      placeholder={placeholder} aria-label={etiqueta}
      className="flex-1 min-w-0 bg-transparent text-[15px] text-tinta placeholder:text-tinta-suave focus:outline-none" />
  </label>
);

