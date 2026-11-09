// src/components/pagos/CuentaCard.tsx
// Una cuota: estado, valor, saldo, botón para registrar un pago y, si tiene
// pagos, su historial desplegable.
import { useState } from 'react';
import { NOMBRE_MES, fmt } from './pagos.constants';
import type { CuentaCobro } from '../../services/pagosApi';
import EstadoBadge from '../ds/EstadoBadge';
import { Icono } from '../ds/Controles';
import { fechaCorta } from '../../utils/fechas';

const ICONO_ESTADO: Record<string, { icono: string; clase: string }> = {
  PAGADO:    { icono: 'check_circle', clase: 'bg-verde-suave text-verde-texto' },
  PENDIENTE: { icono: 'schedule',     clase: 'bg-dorado-suave text-dorado-texto' },
  VENCIDO:   { icono: 'error',        clase: 'bg-rojo-suave text-rojo' },
};

const CuentaCard = ({ cuenta, onPagar }: { cuenta: CuentaCobro; onPagar: (c: CuentaCobro) => void }) => {
  const [expanded, setExpanded] = useState(false);

  const pagado = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
  const saldo  = Math.max(0, Number(cuenta.valor_deuda) - pagado);
  const meta   = ICONO_ESTADO[cuenta.estado] ?? ICONO_ESTADO.PENDIENTE;
  const nombre = cuenta.concepto.nombre === 'MATRÍCULA'
    ? `Matrícula ${cuenta.year}`
    : `${NOMBRE_MES[cuenta.mes]} ${cuenta.year}`;

  return (
    <li className="rounded-2xl bg-crema px-3.5 py-3 flex flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span aria-hidden="true" className={`w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 ${meta.clase}`}>
          <Icono nombre={meta.icono} className="text-[19px]" />
        </span>
        <div className="flex-1 min-w-[120px] flex flex-col">
          <span className="text-sm font-semibold text-tinta">{nombre}</span>
          <span className="text-xs text-tinta-suave">
            Saldo {fmt(saldo)}{pagado > 0 && saldo > 0 && ` · abonado ${fmt(pagado)}`}
          </span>
        </div>
        <span className="text-sm font-semibold text-tinta tabular-nums">{fmt(cuenta.valor_deuda)}</span>
        <EstadoBadge estado={cuenta.estado} />
        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          {cuenta.estado !== 'PAGADO' && (
            <button type="button" onClick={() => onPagar(cuenta)}
              className="min-h-10 px-3.5 rounded-xl bg-vino text-white text-[13px] font-semibold hover:bg-vino-hover transition-colors">
              Registrar pago
            </button>
          )}
          {cuenta.pagos.length > 0 && (
            <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}
              aria-label={`${expanded ? 'Ocultar' : 'Ver'} pagos de ${nombre}`}
              className="w-10 h-10 rounded-xl bg-tarjeta text-tinta-media flex items-center justify-center hover:text-vino transition-colors">
              <Icono nombre="expand_more" className={`text-xl transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {expanded && cuenta.pagos.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-tinta-suave">Historial de pagos</p>
          <ul className="flex flex-col gap-1.5">
            {cuenta.pagos.map((p) => (
              <li key={p.id_pago}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm bg-tarjeta rounded-xl px-3 py-2">
                <span className="flex items-center gap-2 text-tinta-media">
                  <Icono nombre="check_circle" className="text-verde text-base" />
                  {fechaCorta(p.fecha_pago)}
                  <span className="text-tinta-suave">· {p.metodo.nombre.toLowerCase()}</span>
                </span>
                <span className="font-semibold text-verde-texto tabular-nums">{fmt(p.monto_pago)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

export default CuentaCard;
