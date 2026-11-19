// src/components/panel.tsx — piezas visuales compartidas por las páginas del panel.
import type { ComponentType, CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ID_CAPA, zoomCapa } from '../layouts/escala';
import { useEscape } from '../hooks/useEscape';
import * as I from './iconos';

/** Recuadro «AÑO ACADÉMICO [año ▾] [recargar]» del encabezado. Lo usan Inicio y Estudiantes:
    al ser el mismo componente, no se mueve al cambiar de sección. Solo años (una opción más
    ancha, como «Todos», ensancharía el selector y correría el recuadro). */
export function SelectorYear({ id, year, years, onCambiar, onRecargar, cargando }: {
  id: string; year: number; years: number[]; onCambiar: (y: number) => void; onRecargar: () => void; cargando: boolean;
}) {
  return (
    <div className="shrink-0 flex items-stretch h-11 rounded-xl bg-(--p-sup) border border-(--p-borde) overflow-hidden">
      <label htmlFor={id} className="hidden lg:flex items-center px-4 text-[11px] font-bold tracking-[0.16em] text-(--p-suave) border-r border-(--p-borde)">
        AÑO ACADÉMICO
      </label>
      <div className="relative flex items-center">
        <select
          id={id}
          value={year}
          onChange={e => onCambiar(Number(e.target.value))}
          aria-label="Año académico"
          className="appearance-none h-full bg-transparent pl-3 pr-8 sm:pl-4 sm:pr-9 text-[15px] lg:text-[17px] font-bold outline-none cursor-pointer"
        >
          {years.map(y => <option key={y} value={y} className="bg-(--p-sup)">{y}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2.5 sm:right-3"><I.ChevronAbajo tam={16} /></span>
      </div>
      <button
        type="button"
        onClick={onRecargar}
        aria-label="Actualizar datos"
        title="Actualizar datos"
        className="grid place-items-center w-11 bg-(--p-acento) text-[#170f27] hover:brightness-105 transition"
      >
        <span className={cargando ? 'animate-[spin_0.7s_linear_infinite]' : ''}><I.Recargar tam={18} /></span>
      </button>
    </div>
  );
}

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


/* ── Capa, diálogos y aviso flotante ─────────────────────────────
   Se dibujan en #capa-panel (fuera del zoom del contenido) para cubrir toda la pantalla. */

export function Capa({ children }: { children: ReactNode }) {
  const destino = document.getElementById(ID_CAPA);
  return destino ? createPortal(children, destino) : null;
}

/** Con `subtitulo` (y opcionalmente `avatar`) el encabezado es la versión grande:
    avatar, título en tipo normal y una línea de contexto debajo. */
export function Dialogo({ titulo, onCerrar, children, ancho = 'max-w-[460px]', borde = true, subtitulo, avatar }: {
  titulo: string; onCerrar: () => void; children: ReactNode; ancho?: string; borde?: boolean;
  subtitulo?: ReactNode; avatar?: ReactNode;
}) {
  useEscape(onCerrar);
  return (
    <Capa>
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className="velo absolute inset-0 bg-black/40" onClick={onCerrar} />
        <div role="dialog" aria-modal="true" aria-label={titulo} style={zoomCapa}
          className={`dialogo relative w-full ${ancho} max-h-[calc(100dvh-2rem)] flex flex-col rounded-[20px] bg-(--p-sup) text-(--p-tinta) ${borde ? 'border border-(--p-borde)' : ''} shadow-2xl overflow-hidden`}>
          {subtitulo ? (
            <header className="shrink-0 flex items-center gap-3 sm:gap-3.5 px-5 py-4 bg-(--p-banda) text-white">
              {avatar}
              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] sm:text-[18px] leading-tight font-bold tracking-tight">{titulo}</h2>
                <p className="mt-1 text-[12.5px] leading-snug text-white/80 truncate">{subtitulo}</p>
              </div>
              <button type="button" onClick={onCerrar} aria-label="Cerrar"
                className="grid place-items-center shrink-0 size-10 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/15">
                <I.Cerrar tam={17} />
              </button>
            </header>
          ) : (
            <header className="shrink-0 flex items-center gap-3 h-12 pl-5 pr-2 bg-(--p-banda) text-white">
              <h2 className="flex-1 text-[12.5px] font-bold tracking-[0.14em] uppercase">{titulo}</h2>
              <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid place-items-center size-8 text-white/70 hover:text-white"><I.Cerrar tam={17} /></button>
            </header>
          )}
          <div className="p-5 overflow-y-auto">{children}</div>
        </div>
      </div>
    </Capa>
  );
}

export function BotonesDialogo({ onCancelar, texto, enviando, peligro = false }: { onCancelar: () => void; texto: string; enviando: boolean; peligro?: boolean }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button type="button" onClick={onCancelar} className="h-10 px-4 rounded-xl border border-(--p-borde) text-[13.5px] font-semibold hover:bg-(--p-hover)">
        Cancelar
      </button>
      <button
        type="submit"
        disabled={enviando}
        className={`h-10 px-5 rounded-xl text-[12.5px] font-bold tracking-[0.12em] uppercase disabled:opacity-60 ${
          peligro ? 'bg-(--p-banda) text-white' : 'bg-(--p-acento) text-[#170f27]'
        }`}
      >
        {enviando ? 'Guardando…' : texto}
      </button>
    </div>
  );
}

export function ErrorFormulario({ texto }: { texto: string }) {
  return texto ? <p role="alert" className="mt-4 text-[13.5px] font-medium text-(--p-error)">{texto}</p> : null;
}

/** Aviso que sube desde abajo, por encima de la página: no mueve nada, así nadie hace clic
    en la fila equivocada cuando aparece. */
export function AvisoFlotante({ texto, onCerrar }: { texto: string; onCerrar: () => void }) {
  return (
    <Capa>
      <div
        role="status"
        style={zoomCapa}
        className="toast fixed z-[60] left-3 right-3 bottom-[96px] sm:left-auto sm:right-6 lg:bottom-6 sm:w-[400px]
                   flex items-center gap-3 rounded-2xl bg-(--p-banda) text-white px-4 py-3.5 shadow-2xl shadow-black/25"
      >
        <span className="grid place-items-center shrink-0 size-8 rounded-full bg-(--p-acento) text-[#170f27]"><I.Check tam={17} /></span>
        <span className="flex-1 min-w-0 text-[14px] font-medium leading-snug">{texto}</span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar aviso"
          className="grid place-items-center shrink-0 size-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
          <I.Cerrar tam={16} />
        </button>
      </div>
    </Capa>
  );
}

/* ── Panel de filtros (celular y tablet) ───────────────────────── */

/** `unidad`: [singular, plural] para el botón «VER 3 ESTUDIANTES». */
export function PanelFiltros({
  activos, resultados, unidad, onLimpiar, onCerrar, children,
}: { activos: number; resultados: number; unidad: [string, string]; onLimpiar: () => void; onCerrar: () => void; children: ReactNode }) {
  useEscape(onCerrar);
  return (
    <Capa>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
        <div className="velo absolute inset-0 bg-black/45" onClick={onCerrar} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          style={zoomCapa}
          className="hoja relative w-full sm:max-w-[440px] rounded-t-[24px] sm:rounded-[24px] bg-(--p-sup) text-(--p-tinta) shadow-2xl overflow-hidden
                     pb-[env(safe-area-inset-bottom)]"
        >
          <header className="flex items-center gap-3 h-14 pl-5 pr-3 bg-(--p-banda) text-white">
            <span className="text-(--p-acento)"><I.Filtros tam={18} /></span>
            <h2 className="flex-1 text-[12.5px] font-bold tracking-[0.14em] uppercase">Filtros</h2>
            <button type="button" onClick={onCerrar} aria-label="Cerrar filtros"
              className="grid place-items-center size-9 rounded-xl bg-white/10 hover:bg-white/20">
              <I.Cerrar tam={17} />
            </button>
          </header>
          <div className="flex flex-col gap-3 p-4">{children}</div>
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            <button type="button" onClick={onLimpiar} disabled={!activos}
              className="h-12 rounded-xl border border-(--p-borde) text-[14px] font-bold hover:bg-(--p-hover) disabled:opacity-45">
              Limpiar
            </button>
            <button type="button" onClick={onCerrar}
              className="h-12 rounded-xl bg-(--p-acento) text-[#170f27] text-[12.5px] font-bold tracking-[0.12em] hover:brightness-105">
              VER {resultados} {(resultados === 1 ? unidad[0] : unidad[1]).toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </Capa>
  );
}

/** Filtro de lista: ícono + select compacto (fila del computador o panel del celular). */
export function Filtro({
  Icono, etiqueta, valor, onCambio, opciones, ancho = 'w-[210px]',
}: {
  ancho?: string;
  Icono: ComponentType<{ tam?: number }>;
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  opciones: [string, string][];
}) {
  return (
    <label className={`relative flex items-center ${ancho} h-11 rounded-xl border border-(--p-borde) focus-within:border-(--p-acento) transition-colors`}>
      <span className="pointer-events-none absolute left-3.5 text-(--p-suave)"><Icono tam={16} /></span>
      <select
        value={valor}
        onChange={e => onCambio(e.target.value)}
        aria-label={etiqueta}
        className="appearance-none w-full h-full bg-transparent pl-10 pr-9 text-[13.5px] font-semibold outline-none cursor-pointer truncate"
      >
        {opciones.map(([v, t]) => <option key={v} value={v} className="bg-(--p-sup)">{t}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3"><I.ChevronAbajo tam={15} /></span>
    </label>
  );
}

export type Vista = 'lista' | 'tarjetas';

/** En celular y tablet la tabla no cabe: ahí arranca en tarjetas. */
export const vistaInicial = (): Vista =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 64rem)').matches ? 'lista' : 'tarjetas';

/** Botones «lista / tarjetas» para la banda oscura de una tarjeta (Estudiantes, Docentes). */
export function SelectorVista({ vista, onCambio }: { vista: Vista; onCambio: (v: Vista) => void }) {
  const boton = (v: Vista, etiqueta: string, icono: ReactNode) => (
    <button type="button" onClick={() => onCambio(v)} aria-label={etiqueta} aria-pressed={vista === v} title={etiqueta}
      className={`grid place-items-center size-8 rounded-[9px] ${vista === v ? 'bg-(--p-acento) text-[#170f27]' : 'text-white/70 hover:text-white'}`}>
      {icono}
    </button>
  );
  return (
    <div className="flex items-center gap-1 p-1 rounded-[12px] bg-white/10" role="group" aria-label="Vista">
      {boton('lista', 'Ver como lista', <I.Lista tam={16} />)}
      {boton('tarjetas', 'Ver como tarjetas', <I.Grilla tam={15} />)}
    </div>
  );
}
