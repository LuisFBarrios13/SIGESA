// src/components/acudiente/CuentaItem.tsx
// Single Responsibility: una cuenta de cobro con accordion de historial de pagos.

import { useState } from 'react';
import type { CuentaCobro } from '../../services/pagosApi';

const NOMBRE_MES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo',     4: 'Abril',
  5: 'Mayo',  6: 'Junio',   7: 'Julio',     8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

const ESTADO_META: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  PENDIENTE: { label: 'Pendiente', icon: 'schedule',     bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  PAGADO:    { label: 'Pagado',    icon: 'check_circle', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  VENCIDO:   { label: 'Vencido',   icon: 'cancel',       bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
};

const CONCEPTO_META: Record<string, { icon: string; bg: string; text: string }> = {
  'MATRÍCULA': { icon: 'how_to_reg', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  'PENSIÓN':   { icon: 'payments',   bg: 'bg-purple-100', text: 'text-purple-700' },
};

const fmt = (n: number | string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(Number(n));

const CuentaItem = ({ cuenta }: { cuenta: CuentaCobro }) => {
  const [expanded, setExpanded] = useState(false);

  const meta      = ESTADO_META[cuenta.estado]           ?? ESTADO_META['PENDIENTE'];
  const concMeta  = CONCEPTO_META[cuenta.concepto.nombre] ?? CONCEPTO_META['PENSIÓN'];
  const pagado    = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
  const saldo     = Math.max(0, Number(cuenta.valor_deuda) - pagado);
  const pct       = Math.min(100, Math.round((pagado / Number(cuenta.valor_deuda)) * 100));
  const label     = cuenta.concepto.nombre === 'MATRÍCULA'
    ? `Matrícula ${cuenta.year}`
    : `${NOMBRE_MES[cuenta.mes]} ${cuenta.year}`;

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all
      ${cuenta.estado === 'PAGADO'  ? 'border-emerald-200' :
        cuenta.estado === 'VENCIDO' ? 'border-red-200'     : 'border-stone-200'}`}>

      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${concMeta.bg}`}>
          <span className={`material-symbols-outlined text-base ${concMeta.text}`}>{concMeta.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-on-surface">{label}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
              font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
              <span className="material-symbols-outlined text-[11px]">{meta.icon}</span>
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all
                  ${cuenta.estado === 'PAGADO' ? 'bg-emerald-500' : 'bg-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-stone-400 font-bold w-8 text-right">{pct}%</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-on-surface">{fmt(cuenta.valor_deuda)}</p>
          {saldo > 0 && (
            <p className="text-[11px] text-orange-600 font-semibold mt-0.5">Saldo: {fmt(saldo)}</p>
          )}
        </div>

        {cuenta.pagos.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-xl">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/50 space-y-2">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Pagos realizados
          </p>
          {cuenta.pagos.map((p) => (
            <div key={p.id_pago}
              className="flex items-center justify-between text-xs bg-white rounded-lg
                px-3 py-2 border border-stone-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                <span className="text-stone-600">
                  {new Date(p.fecha_pago).toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </span>
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded font-medium text-[10px]">
                  {p.metodo.nombre}
                </span>
              </div>
              <span className="font-bold text-secondary">{fmt(p.monto_pago)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CuentaItem;