// src/components/ds/Campo.tsx
// Etiqueta + control + mensaje de error, y la tarjeta de un paso del formulario.
import type { ReactNode } from 'react';
import { Icono } from './Controles';

interface CampoProps {
  etiqueta:   string;
  id:         string;
  error?:     string;
  requerido?: boolean;
  /** Ocupa las dos columnas de la cuadrícula. */
  ancho?:     boolean;
  children:   ReactNode;
}

export const Campo = ({ etiqueta, id, error, requerido, ancho, children }: CampoProps) => (
  <div className={`flex flex-col gap-1.5 min-w-0 ${ancho ? 'sm:col-span-2' : ''}`}>
    <label htmlFor={id} className="text-[13px] font-semibold text-tinta-media">
      {etiqueta}{requerido && <span className="text-rojo ml-0.5" aria-hidden="true"> *</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs font-medium text-rojo flex items-center gap-1" role="alert">
        <Icono nombre="error" className="text-[15px]" />{error}
      </p>
    )}
  </div>
);

interface PasoProps {
  paso?:     number;
  titulo:    string;
  icono:     string;
  nota?:     string;
  children:  ReactNode;
}

/** Tarjeta blanca de una sección del formulario: «Paso 1 · Datos del estudiante». */
export const PasoFormulario = ({ paso, titulo, icono, nota, children }: PasoProps) => (
  <section className="bg-tarjeta rounded-[22px] md:rounded-[24px] p-[18px] md:p-[26px] flex flex-col gap-5">
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="w-[46px] h-[46px] rounded-full bg-vino-suave text-vino flex items-center justify-center shrink-0">
        <Icono nombre={icono} className="text-[21px]" />
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        {paso && <span className="text-xs font-semibold text-tinta-suave">Paso {paso}</span>}
        <h2 className="m-0 text-[17px] md:text-[19px] font-semibold text-tinta">{titulo}</h2>
      </div>
      {nota && <span className="text-[13px] text-tinta-suave shrink-0">{nota}</span>}
    </div>
    {children}
  </section>
);
