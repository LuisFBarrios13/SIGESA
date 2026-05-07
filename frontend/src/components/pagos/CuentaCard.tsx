// src/components/pagos/CuentaCard.tsx
import { useState } from 'react';
import EstadoBadge from './EstadoBadge';
import MoneyText from './MoneyText';
import { NOMBRE_MES, CONCEPTO_META, fmt } from './pagos.constants';
import type { CuentaCobro } from '../../services/pagosApi';

interface CuentaCardProps {
  cuenta:  CuentaCobro;
  onPagar: (c: CuentaCobro) => void;
}

const CuentaCard = ({ cuenta, onPagar }: CuentaCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const concMeta    = CONCEPTO_META[cuenta.concepto.nombre] ?? CONCEPTO_META['PENSIÓN'];
  const totalPagado = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
  const saldo       = Math.max(0, Number(cuenta.valor_deuda) - totalPagado);
  const pct         = Math.min(100, Math.round((totalPagado / Number(cuenta.valor_deuda)) * 100));

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${
      cuenta.estado === 'PAGADO'  ? 'border-emerald-200 bg-emerald-50/30' :
      cuenta.estado === 'VENCIDO' ? 'border-red-200 bg-red-50/20'         :
                                    'border-stone-200 bg-white'
    }`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${concMeta.bg}`}>
          <span className={`material-symbols-outlined text-lg ${concMeta.text}`}>{concMeta.icon}</span>
        </div>

        {/* Label + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-on-surface">
              {cuenta.concepto.nombre === 'MATRÍCULA'
                ? `Matrícula ${cuenta.year}`
                : NOMBRE_MES[cuenta.mes]}
            </span>
            <EstadoBadge estado={cuenta.estado} />
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  cuenta.estado === 'PAGADO' ? 'bg-emerald-500' : 'bg-primary'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-stone-400 font-bold w-8 text-right">{pct}%</span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <MoneyText value={cuenta.valor_deuda} className="text-sm text-on-surface" />
          {saldo > 0 && (
            <p className="text-[11px] text-orange-600 font-semibold mt-0.5">
              Saldo: {fmt(saldo)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 flex-shrink-0">
          {cuenta.estado !== 'PAGADO' && (
            <button
              onClick={() => onPagar(cuenta)}
              className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold
                hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">add_card</span>
              Pagar
            </button>
          )}
          {cuenta.pagos.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-stone-400 hover:text-primary hover:bg-stone-100 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined text-lg">
                {expanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Payment history */}
      {expanded && cuenta.pagos.length > 0 && (
        <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/60 space-y-2">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            Historial de pagos
          </p>
          {cuenta.pagos.map((p) => (
            <div
              key={p.id_pago}
              className="flex items-center justify-between text-xs bg-white rounded-lg
                px-3 py-2 border border-stone-100"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                <span className="text-stone-600">
                  {new Date(p.fecha_pago).toLocaleDateString('es-CO')}
                </span>
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded font-medium">
                  {p.metodo.nombre}
                </span>
              </div>
              <MoneyText value={p.monto_pago} className="text-secondary text-xs" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CuentaCard;