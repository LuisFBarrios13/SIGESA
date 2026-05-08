// src/components/deudores/DeudorCard.tsx
// Single Responsibility: muestra un deudor con sus cuentas vencidas e historial.

import { useState } from 'react';
import { fmt, NOMBRE_MES, CONCEPTO_META } from '../pagos/pagos.constants';
import type { DeudorAgrupado } from '../../types/deudores';
import type { CuentaCobro } from '../../services/pagosApi';

// ── Historial de pagos de una cuenta ─────────────────────────

const HistorialCuenta = ({ cuenta }: { cuenta: CuentaCobro }) => {
  const pagado = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
  const saldo  = Math.max(0, Number(cuenta.valor_deuda) - pagado);
  const cm     = CONCEPTO_META[cuenta.concepto.nombre] ?? CONCEPTO_META['PENSIÓN'];

  return (
    <div className="rounded-lg border border-red-100 overflow-hidden">
      {/* Cuenta header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-red-50">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${cm.bg}`}>
            <span className={`material-symbols-outlined text-[14px] ${cm.text}`}>{cm.icon}</span>
          </div>
          <span className="text-sm font-semibold text-on-surface">
            {cuenta.concepto.nombre === 'MATRÍCULA'
              ? `Matrícula ${cuenta.year}`
              : `${NOMBRE_MES[cuenta.mes]} ${cuenta.year}`}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-400">Deuda total</p>
          <p className="text-sm font-bold text-red-700">{fmt(cuenta.valor_deuda)}</p>
        </div>
      </div>

      {/* Saldo pendiente */}
      <div className="px-4 py-2 bg-white flex items-center justify-between border-b border-stone-100">
        <span className="text-xs text-stone-500">Saldo pendiente</span>
        <span className="text-sm font-black text-red-600">{fmt(saldo)}</span>
      </div>

      {/* Historial de pagos */}
      {cuenta.pagos.length > 0 ? (
        <div className="px-4 py-2 bg-white space-y-1.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider pt-1">
            Pagos realizados
          </p>
          {cuenta.pagos.map((p) => (
            <div
              key={p.id_pago}
              className="flex items-center justify-between text-xs bg-stone-50
                rounded-lg px-3 py-2 border border-stone-100"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">
                  check_circle
                </span>
                <span className="text-stone-600">
                  {new Date(p.fecha_pago).toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </span>
                <span className="px-2 py-0.5 bg-stone-200 text-stone-600 rounded font-medium text-[10px]">
                  {p.metodo.nombre}
                </span>
              </div>
              <span className="font-bold text-secondary">{fmt(p.monto_pago)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-2.5 bg-white">
          <p className="text-xs text-stone-400 italic">Sin pagos registrados</p>
        </div>
      )}
    </div>
  );
};

// ── Tarjeta principal del deudor ──────────────────────────────

interface DeudorCardProps {
  deudor: DeudorAgrupado;
  rank:   number;
}

const DeudorCard = ({ deudor, rank }: DeudorCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const initials = deudor.estudiante.nombre
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const conPagosParciales = deudor.cuentas_vencidas.some((c) => c.pagos.length > 0);

  return (
    <div className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden transition-all
      ${expanded ? 'border-red-300' : 'border-red-100 hover:border-red-200'}`}>

      {/* Header del deudor — clic en todo el área para expandir */}
      <div
        onClick={() => setExpanded((v) => !v)}
        className="px-5 py-4 flex items-center gap-4 cursor-pointer select-none"
      >
        {/* Ranking */}
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center
          flex-shrink-0 text-xs font-black text-red-600">
          {rank}
        </div>

        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-red-50 border-2 border-red-200
          flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-black text-red-700">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-on-surface text-sm truncate">
              {deudor.estudiante.nombre}
            </p>
            {conPagosParciales && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                <span className="material-symbols-outlined text-[10px]">payments</span>
                Pagos parciales
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-stone-400 font-mono">
              DNI {deudor.estudiante.numero_identidad}
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-xs text-stone-500">
              {deudor.grado.nombre}
            </span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
              bg-stone-100 text-stone-600">
              {deudor.grado.jornada === 'MAÑANA' ? '☀️ Mañana' : '🌙 Tarde'}
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-xs text-stone-400">{deudor.year}</span>
          </div>
        </div>

        {/* Deuda + toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-stone-400 uppercase tracking-wide font-bold">
              Saldo vencido
            </p>
            <p className="text-lg font-black text-red-600">{fmt(deudor.saldo_total)}</p>
            <p className="text-[10px] text-stone-400">
              {deudor.cuentas_vencidas.length} cuenta{deudor.cuentas_vencidas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <span className={`material-symbols-outlined text-xl transition-colors ${
            expanded ? 'text-red-400' : 'text-stone-300'
          }`}>
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>

      {/* Historial expandido */}
      {expanded && (
        <div className="border-t border-red-100 px-5 py-4 bg-red-50/30 space-y-3">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Cuentas vencidas e historial de pagos
          </p>
          {deudor.cuentas_vencidas.map((cuenta) => (
            <HistorialCuenta key={cuenta.id_cuenta} cuenta={cuenta} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeudorCard;