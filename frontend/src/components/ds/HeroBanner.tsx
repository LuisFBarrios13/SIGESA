// src/components/ds/HeroBanner.tsx
// Banner principal con degradado vinotinto → verde.
import type { ReactNode } from 'react';

export interface HeroChip {
  texto: string;
  /** Chip blanco con texto verde (p. ej. el estado "Activo"). */
  destacado?: boolean;
}

interface Props {
  etiqueta?: string;
  titulo:    string;
  chips?:    HeroChip[];
  /** Muestra el escudo del colegio a la derecha (solo en pantallas medianas o más). */
  escudo?:   boolean;
  children?: ReactNode;
}

const HeroBanner = ({ etiqueta, titulo, chips = [], escudo = false, children }: Props) => (
  <section className="relative overflow-hidden rounded-[24px] sm:rounded-card-lg bg-hero text-white
    px-[22px] py-[22px] sm:px-9 sm:py-8 flex flex-wrap items-center justify-between gap-6">
    <div aria-hidden="true"
      className="absolute -right-10 -top-10 sm:right-36 sm:-top-16 w-36 h-36 sm:w-52 sm:h-52 rounded-full bg-white/10" />

    <div className="relative flex flex-col gap-2.5 min-w-0 max-w-[620px]">
      {etiqueta && <span className="text-[13px] sm:text-sm font-medium text-[#FBEFE6]">{etiqueta}</span>}
      <h2 className="m-0 text-[22px] sm:text-[32px] font-semibold tracking-tight leading-tight break-words">{titulo}</h2>
      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
          {chips.map((c) => (
            <li key={c.texto}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-[13px]
                ${c.destacado ? 'bg-white text-verde-texto font-semibold' : 'bg-white/20 font-semibold'}`}>
              {c.destacado && <span aria-hidden="true">● </span>}
              {c.texto}
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>

    {escudo && (
      <img src="/escudo-320.png" alt="" width={132} height={132}
        className="relative hidden md:block w-[132px] h-[132px] rounded-full object-cover bg-white
          border-[6px] border-white/35 shrink-0" />
    )}
  </section>
);

export default HeroBanner;
