// src/components/ds/DataTable.tsx
// Tabla en pantallas medianas o más; lista de tarjetas en el celular.
//
// Cada columna dice dónde va en el celular:
//   'titulo'    → texto principal (negrita)
//   'subtitulo' → línea gris debajo (varias se unen con " · ")
//   'extremo'   → a la derecha (p. ej. el estado)
//   'oculto'    → solo en la tabla
import { Fragment, useState, type ReactNode } from 'react';

export interface Columna<T> {
  id:      string;
  titulo:  string;
  celda:   (fila: T) => ReactNode;
  /** Valor en texto para el celular (si no, se usa celda). */
  texto?:  (fila: T) => string;
  movil?:  'titulo' | 'subtitulo' | 'extremo' | 'oculto';
  alinear?: 'izquierda' | 'derecha';
  /** Negrita en la tabla. */
  destacar?: boolean;
}

interface Props<T> {
  columnas:   Columna<T>[];
  filas:      T[];
  claveFila:  (fila: T) => string | number;
  /** Contenido desplegable de una fila (null = sin detalle). */
  detalle?:   (fila: T) => ReactNode | null;
  etiquetaDetalle?: (fila: T) => string;
  vacio?:     ReactNode;
  /** Descripción para lectores de pantalla. */
  descripcion?: string;
}

const BotonDetalle = ({ abierto, etiqueta, onClick }: { abierto: boolean; etiqueta: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} aria-expanded={abierto} aria-label={etiqueta}
    className="w-11 h-11 -my-2 shrink-0 rounded-full flex items-center justify-center text-tinta-suave
      hover:bg-crema hover:text-vino transition-colors">
    <span aria-hidden="true" className={`material-symbols-outlined text-xl transition-transform ${abierto ? 'rotate-180' : ''}`}>
      expand_more
    </span>
  </button>
);

function DataTable<T>({
  columnas, filas, claveFila, detalle, etiquetaDetalle, vacio, descripcion,
}: Props<T>) {
  const [abiertas, setAbiertas] = useState<Set<string | number>>(new Set());
  const alternar = (k: string | number) =>
    setAbiertas((prev) => {
      const s = new Set(prev);
      if (s.has(k)) s.delete(k); else s.add(k);
      return s;
    });

  if (!filas.length) return <>{vacio}</>;

  const conDetalle = !!detalle;
  const porRol = (r: Columna<T>['movil']) => columnas.filter((c) => (c.movil ?? 'oculto') === r);
  const textoDe = (c: Columna<T>, f: T) => (c.texto ? c.texto(f) : c.celda(f));

  return (
    <>
      {/* ── Tabla (≥ md) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {descripcion && <caption className="sr-only">{descripcion}</caption>}
          <thead>
            <tr className="bg-crema text-left">
              {columnas.map((c, i) => (
                <th key={c.id} scope="col"
                  className={`px-4 py-3.5 font-semibold text-tinta whitespace-nowrap
                    ${c.alinear === 'derecha' ? 'text-right' : ''}
                    ${i === 0 ? 'rounded-l-xl' : ''}
                    ${i === columnas.length - 1 && !conDetalle ? 'rounded-r-xl' : ''}`}>
                  {c.titulo}
                </th>
              ))}
              {conDetalle && <th scope="col" className="rounded-r-xl w-14"><span className="sr-only">Detalle</span></th>}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const k = claveFila(f);
              const det = detalle?.(f) ?? null;
              const abierta = abiertas.has(k);
              return (
                <Fragment key={k}>
                  <tr className={abierta ? '' : 'border-b border-linea'}>
                    {columnas.map((c) => (
                      <td key={c.id}
                        className={`px-4 py-3.5 ${c.destacar ? 'font-semibold text-tinta' : 'text-tinta-media'}
                          ${c.alinear === 'derecha' ? 'text-right tabular-nums' : ''}`}>
                        {c.celda(f)}
                      </td>
                    ))}
                    {conDetalle && (
                      <td className="px-2 py-3.5 text-right">
                        {det && (
                          <BotonDetalle abierto={abierta} onClick={() => alternar(k)}
                            etiqueta={etiquetaDetalle?.(f) ?? 'Ver detalle'} />
                        )}
                      </td>
                    )}
                  </tr>
                  {abierta && det && (
                    <tr className="border-b border-linea">
                      <td colSpan={columnas.length + 1} className="px-4 pb-4">{det}</td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Lista (celular) ── */}
      <ul className="md:hidden flex flex-col">
        {filas.map((f) => {
          const k = claveFila(f);
          const det = detalle?.(f) ?? null;
          const abierta = abiertas.has(k);
          const subtitulos = porRol('subtitulo');
          return (
            <li key={k} className="border-b border-linea last:border-b-0 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  {porRol('titulo').map((c) => (
                    <span key={c.id} className="text-sm font-bold text-tinta break-words">{textoDe(c, f)}</span>
                  ))}
                  {subtitulos.length > 0 && (
                    <span className="text-xs text-tinta-suave break-words">
                      {subtitulos.map((c, i) => (
                        <Fragment key={c.id}>{i > 0 && ' · '}{textoDe(c, f)}</Fragment>
                      ))}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {porRol('extremo').map((c) => <Fragment key={c.id}>{c.celda(f)}</Fragment>)}
                  {det && (
                    <BotonDetalle abierto={abierta} onClick={() => alternar(k)}
                      etiqueta={etiquetaDetalle?.(f) ?? 'Ver detalle'} />
                  )}
                </div>
              </div>
              {abierta && det && <div className="mt-3">{det}</div>}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default DataTable;
