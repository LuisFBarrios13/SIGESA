// src/components/ds/Estados.tsx
// Cargando, aviso (vacío o error) y mensaje en línea, con el estilo del diseño.
import type { ReactNode } from 'react';
import { Icono } from './Controles';

export const Cargando = ({ texto = 'Cargando…' }: { texto?: string }) => (
  <div role="status" className="bg-tarjeta rounded-card py-14 flex flex-col items-center gap-3 text-tinta-suave">
    <Icono nombre="progress_activity" className="animate-spin text-vino text-4xl" />
    <p className="text-sm">{texto}</p>
  </div>
);

export const Aviso = ({ icono, titulo, texto, children, enTarjeta = true }: {
  icono: string; titulo: string; texto?: string; children?: ReactNode; enTarjeta?: boolean;
}) => (
  <div className={`${enTarjeta ? 'bg-tarjeta rounded-card' : ''} py-12 px-6 flex flex-col items-center gap-2.5 text-center`}>
    <Icono nombre={icono} className="text-5xl text-tinta-suave" />
    <p className="text-sm font-semibold text-tinta">{titulo}</p>
    {texto && <p className="text-sm text-tinta-suave max-w-sm">{texto}</p>}
    {children}
  </div>
);

/** Franja de mensaje: éxito, error o información. */
export const Mensaje = ({ tipo, children, onCerrar }: {
  tipo: 'exito' | 'error' | 'info'; children: ReactNode; onCerrar?: () => void;
}) => {
  const estilo = {
    exito: { c: 'bg-verde-suave text-verde-texto', i: 'check_circle' },
    error: { c: 'bg-rojo-suave text-rojo',         i: 'error' },
    info:  { c: 'bg-azul-suave text-azul-texto',   i: 'info' },
  }[tipo];
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${estilo.c}`}>
      <Icono nombre={estilo.i} className="text-xl shrink-0" />
      <div className="flex-1 min-w-0">{children}</div>
      {onCerrar && (
        <button type="button" onClick={onCerrar} aria-label="Cerrar mensaje" className="shrink-0 opacity-70 hover:opacity-100">
          <Icono nombre="close" className="text-lg" />
        </button>
      )}
    </div>
  );
};
