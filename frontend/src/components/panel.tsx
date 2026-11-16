// src/components/panel.tsx — piezas visuales compartidas por las páginas del panel.
import type { ComponentType, CSSProperties, ReactNode } from 'react';

/** Barra con una perilla al final, como en el diseño. */
export function Progreso({ valor, relleno, borde }: { valor: number; relleno: string; borde: string }) {
  return (
    <div className="relative h-[5px] rounded-full bg-(--p-menta)" role="presentation">
      <div className={`barra-llena absolute inset-y-0 left-0 rounded-full ${relleno}`} style={{ width: `${valor}%` }} />
      <div
        className={`perilla absolute top-1/2 size-3.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-(--p-sup) border-2 ${borde}`}
        style={{ left: `${Math.max(3, Math.min(97, valor))}%` }}
      />
    </div>
  );
}

/** Un segmento por docente (hasta 18, para que no se vuelvan puntos). */
export function Segmentos({ n }: { n: number }) {
  if (n <= 0) return <div className="h-[5px] rounded-full bg-(--p-menta)" />;
  return (
    <div className="flex gap-1">
      {Array.from({ length: Math.min(n, 18) }, (_, i) => (
        <span key={i} className="barra-llena flex-1 h-[5px] rounded-full bg-(--p-acento)" style={{ '--i': i } as CSSProperties} />
      ))}
    </div>
  );
}

/* ── Tarjeta con encabezado oscuro ─────────────────────────────── */

export function Tarjeta({
  Icono, titulo, accion, children, className = '',
}: {
  Icono: ComponentType<{ tam?: number }>;
  titulo: string;
  accion?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col rounded-[20px] bg-(--p-sup) border border-(--p-borde) overflow-hidden transition-colors ${className}`}>
      <header className="shrink-0 flex items-center gap-2.5 sm:gap-3 h-12 pl-4 sm:pl-5 pr-2 bg-(--p-banda) text-white">
        <span className="text-(--p-acento)"><Icono tam={17} /></span>
        <h2 className="flex-1 min-w-0 truncate text-[11.5px] min-[400px]:text-[12.5px] font-bold tracking-[0.1em] min-[400px]:tracking-[0.14em] uppercase">{titulo}</h2>
        {accion}
      </header>
      {children}
    </section>
  );
}

