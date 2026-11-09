// src/components/ds/GraficaBarras.tsx
// Columnas apiladas con leyenda y tooltip (al pasar el mouse o con el teclado).
// Cada columna tiene partes de abajo hacia arriba, separadas por 2px.
import { useState } from 'react';

export interface Serie { nombre: string; color: string }  // color: clase bg-*
export interface Columna {
  clave:    string;
  etiqueta: string;
  /** Un valor por serie, en el mismo orden (de abajo hacia arriba). */
  valores:  number[];
  /** Etiqueta para pantallas angostas (p. ej. la inicial del mes). */
  etiquetaCorta?: string;
  /** Texto encima de la columna (opcional). */
  rotulo?:  string;
}

interface Props {
  series:   Serie[];
  columnas: Columna[];
  formato:  (n: number) => string;
  descripcion: string;
  alto?:    number;
}

const GraficaBarras = ({ series, columnas, formato, descripcion, alto = 200 }: Props) => {
  const [activa, setActiva] = useState<number | null>(null);
  const maximo = Math.max(...columnas.map((c) => c.valores.reduce((a, b) => a + b, 0)), 1);
  const plantilla = { gridTemplateColumns: `repeat(${columnas.length}, minmax(0, 1fr))` };

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-4 text-[13px] text-tinta-suave">
        {series.map((s) => (
          <li key={s.nombre} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-[3px] ${s.color}`} />{s.nombre}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <ol aria-label={descripcion} className="grid items-end gap-1 border-b border-dashed border-[#DDD6D0] pb-1"
          style={{ ...plantilla, height: alto + 24 }} onMouseLeave={() => setActiva(null)}>
          {columnas.map((c, i) => {
            const total = c.valores.reduce((a, b) => a + b, 0);
            const altoTotal = total > 0 ? Math.max(6, (total / maximo) * alto) : 0;
            const texto = `${c.etiqueta}: ` + series.map((s, j) => `${s.nombre.toLowerCase()} ${formato(c.valores[j])}`).join(', ');
            // Partes visibles, de arriba hacia abajo para pintarlas en columna
            const partes = c.valores.map((v, j) => ({ v, j })).filter((p) => p.v > 0).reverse();
            return (
              <li key={c.clave} tabIndex={0} aria-label={texto}
                onMouseEnter={() => setActiva(i)} onFocus={() => setActiva(i)} onBlur={() => setActiva(null)}
                className="relative h-full flex flex-col items-center justify-end gap-1.5 rounded-lg outline-none focus-visible:bg-crema">
                {activa === i && (
                  <div role="tooltip" className={`absolute bottom-full mb-1 z-10 w-max max-w-[220px] bg-tinta text-white text-xs
                    rounded-lg px-3 py-2 ${i > columnas.length / 2 ? 'right-0' : 'left-0'}`}>
                    <p className="font-semibold">{c.etiqueta}</p>
                    {series.map((s, j) => <p key={s.nombre}>{s.nombre}: {formato(c.valores[j])}</p>)}
                  </div>
                )}
                {c.rotulo && total > 0 && <span className="text-[11px] font-semibold text-tinta-suave">{c.rotulo}</span>}
                <div className="w-full max-w-[28px] flex flex-col gap-[2px]" style={{ height: altoTotal }}>
                  {partes.map((p, k) => (
                    <div key={p.j} className={`${series[p.j].color} ${k === 0 ? 'rounded-t-[4px]' : ''}`}
                      style={{ flexGrow: p.v, minHeight: 3 }} />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
        <div aria-hidden="true" className="grid gap-1" style={plantilla}>
          {columnas.map((c) => (
            <span key={c.clave} className="text-xs text-tinta-suave text-center truncate">
              {c.etiquetaCorta ? <><span className="sm:hidden">{c.etiquetaCorta}</span><span className="hidden sm:inline">{c.etiqueta}</span></> : c.etiqueta}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GraficaBarras;
