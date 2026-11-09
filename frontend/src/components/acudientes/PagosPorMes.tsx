// src/components/acudientes/PagosPorMes.tsx
// Columnas apiladas por cuota: lo pagado (verde) y lo que falta (dorado).
// Se muestra en pantallas medianas o más; en el celular basta la lista de cuotas.
import { useState } from 'react';
import { fmt, fmtCorto, type Cuota } from './cuotas';

const ALTO = 200; // px del área de barras

const PagosPorMes = ({ cuotas }: { cuotas: Cuota[] }) => {
  const [activa, setActiva] = useState<number | null>(null);
  const maximo = Math.max(...cuotas.map((c) => c.valor), 1);

  return (
    <section className="bg-tarjeta rounded-[24px] p-[26px] flex flex-col gap-5 min-w-0">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="m-0 text-xl font-semibold">Pagos por mes</h2>
        <ul className="flex gap-4 text-[13px] text-tinta-suave">
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px] bg-verde" />Pagado</li>
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px] bg-dorado" />Pendiente</li>
        </ul>
      </div>

      <div className="flex-1 flex flex-col justify-end gap-2">
        <ol className="grid items-end gap-1 border-b border-dashed border-[#DDD6D0] pb-1"
          style={{ gridTemplateColumns: `repeat(${cuotas.length}, minmax(0, 1fr))`, height: ALTO + 28 }}
          onMouseLeave={() => setActiva(null)}>
          {cuotas.map((c, i) => {
            const alto      = Math.max(6, (c.valor / maximo) * ALTO);
            const altoPag   = c.valor ? (Math.min(c.pagado, c.valor) / c.valor) * alto : 0;
            const descripcion = `${c.nombre}: pagado ${fmt(c.pagado)}, pendiente ${fmt(c.saldo)}`;
            return (
              <li key={c.cuenta.id_cuenta} tabIndex={0} aria-label={descripcion}
                onMouseEnter={() => setActiva(i)} onFocus={() => setActiva(i)} onBlur={() => setActiva(null)}
                className="relative h-full flex flex-col items-center justify-end gap-1.5 outline-none
                  focus-visible:bg-crema rounded-lg">
                {activa === i && (
                  <div role="tooltip"
                    className={`absolute bottom-full mb-1 z-10 w-max max-w-[200px] bg-tinta text-white text-xs rounded-lg px-3 py-2
                      ${i > cuotas.length / 2 ? 'right-0' : 'left-0'}`}>
                    <p className="font-semibold">{c.nombre}</p>
                    <p>Pagado: {fmt(c.pagado)}</p>
                    {c.saldo > 0 && <p>Pendiente: {fmt(c.saldo)}</p>}
                  </div>
                )}
                <span className="text-[11px] font-semibold text-tinta-suave">{fmtCorto(c.valor)}</span>
                {/* Pendiente arriba, pagado abajo; 2px de separación entre ambos */}
                <div className="w-full max-w-[28px] flex flex-col gap-[2px]" style={{ height: alto }}>
                  {c.saldo > 0 && <div className="flex-1 min-h-[4px] bg-dorado rounded-t-[4px]" />}
                  {altoPag > 0 && (
                    <div className={`bg-verde ${c.saldo > 0 ? '' : 'rounded-t-[4px]'}`}
                      style={{ height: c.saldo > 0 ? Math.max(4, altoPag - 2) : altoPag }} />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <div aria-hidden="true" className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${cuotas.length}, minmax(0, 1fr))` }}>
          {cuotas.map((c) => (
            <span key={c.cuenta.id_cuenta} className="text-xs text-tinta-suave text-center">{c.corto}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PagosPorMes;
