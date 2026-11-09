// src/components/ds/Tarjeta.tsx
// Tarjeta blanca de sección con título opcional y acciones a la derecha.
import type { ReactNode } from 'react';

interface Props {
  titulo?:    string;
  subtitulo?: string;
  acciones?:  ReactNode;
  children:   ReactNode;
  className?: string;
  /** Sin relleno interior (para tablas que llegan al borde). */
  sinRelleno?: boolean;
}

const Tarjeta = ({ titulo, subtitulo, acciones, children, className = '', sinRelleno = false }: Props) => (
  <section className={`bg-tarjeta rounded-[22px] md:rounded-[24px] flex flex-col gap-4 md:gap-5 min-w-0
    ${sinRelleno ? 'py-[18px] md:py-[26px]' : 'p-[18px] md:p-[26px]'} ${className}`}>
    {(titulo || acciones) && (
      <div className={`flex flex-wrap justify-between items-center gap-3 ${sinRelleno ? 'px-[18px] md:px-[26px]' : ''}`}>
        {titulo && (
          <div className="flex flex-col gap-0.5 min-w-0">
            <h2 className="m-0 text-base md:text-xl font-semibold text-tinta">{titulo}</h2>
            {subtitulo && <p className="text-sm text-tinta-suave">{subtitulo}</p>}
          </div>
        )}
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
    )}
    {children}
  </section>
);

export default Tarjeta;
