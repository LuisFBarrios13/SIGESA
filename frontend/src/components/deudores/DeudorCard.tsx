// src/components/deudores/DeudorCard.tsx
// Un deudor con su saldo vencido. Al desplegarlo muestra cada cuenta vencida
// con su saldo y el historial de pagos (mismo contenido de antes, diseño nuevo).
import { useState } from 'react';
import { fmt, NOMBRE_MES } from '../pagos/pagos.constants';
import type { DeudorAgrupado } from '../../types/deudores';
import type { CuentaCobro } from '../../services/pagosApi';
import EstadoBadge from '../ds/EstadoBadge';
import { Avatar, Icono } from '../ds/Controles';
import type { Tono } from '../ds/tonos';

const TONOS_AVATAR: Tono[] = ['vino', 'verde', 'dorado', 'azul'];

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Una cuenta vencida con su historial ───────────────────────

const HistorialCuenta = ({ cuenta }: { cuenta: CuentaCobro }) => {
  const pagado = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
  const saldo  = Math.max(0, Number(cuenta.valor_deuda) - pagado);
  const nombre = cuenta.concepto.nombre === 'MATRÍCULA'
    ? `Matrícula ${cuenta.year}`
    : `${NOMBRE_MES[cuenta.mes]} ${cuenta.year}`;

  return (
    <li className="rounded-2xl bg-crema p-3.5 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-tinta">{nombre}</span>
          <span className="text-xs text-tinta-suave">{cuenta.concepto.nombre === 'MATRÍCULA' ? 'Matrícula' : 'Pensión'}</span>
        </div>
        <div className="flex items-center gap-3 text-sm tabular-nums">
          <span className="text-tinta-suave">Valor {fmt(cuenta.valor_deuda)}</span>
          <span className="font-semibold text-rojo">Saldo {fmt(saldo)}</span>
        </div>
      </div>

      {cuenta.pagos.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-tinta-suave">Pagos realizados</p>
          <ul className="flex flex-col gap-1.5">
            {cuenta.pagos.map((p) => (
              <li key={p.id_pago}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm bg-tarjeta rounded-xl px-3 py-2">
                <span className="flex items-center gap-2 text-tinta-media">
                  <Icono nombre="check_circle" className="text-verde text-base" />
                  {fecha(p.fecha_pago)}
                  <span className="text-tinta-suave">· {p.metodo.nombre.toLowerCase()}</span>
                </span>
                <span className="font-semibold text-verde-texto tabular-nums">{fmt(p.monto_pago)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-tinta-suave">Sin pagos registrados</p>
      )}
    </li>
  );
};

// ── Tarjeta del deudor ────────────────────────────────────────

const DeudorCard = ({ deudor, rank }: { deudor: DeudorAgrupado; rank: number }) => {
  const [expanded, setExpanded] = useState(false);
  const { estudiante, grado, cuentas_vencidas: cuentas } = deudor;
  const conPagosParciales = cuentas.some((c) => c.pagos.length > 0);
  const idDetalle = `deudor-${estudiante.numero_identidad}`;

  return (
    <article className="bg-tarjeta rounded-[22px] p-4 sm:p-[22px] flex flex-col">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4">
        <span className="hidden sm:flex w-8 h-8 rounded-[10px] bg-crema items-center justify-center text-sm font-semibold text-tinta-media shrink-0">
          {rank}
        </span>
        <Avatar nombre={estudiante.nombre} tono={TONOS_AVATAR[(rank - 1) % TONOS_AVATAR.length]} tamano={48} />

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-base font-semibold text-tinta break-words">{estudiante.nombre}</h3>
            {conPagosParciales && <EstadoBadge tono="azul">Pagos parciales</EstadoBadge>}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-tinta-suave">
            <span>Doc. {estudiante.numero_identidad}</span>
            <span aria-hidden="true">·</span>
            <span>{grado.nombre}</span>
            <EstadoBadge estado={grado.jornada} />
            <span>· {deudor.year}</span>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4
          border-t border-linea pt-3 sm:border-0 sm:pt-0">
          <div className="flex flex-col sm:items-end">
            <span className="text-[11px] font-semibold text-tinta-suave">Saldo vencido</span>
            <span className="text-xl font-semibold text-rojo tabular-nums">{fmt(deudor.saldo_total)}</span>
            <span className="text-xs text-tinta-suave">
              {cuentas.length} cuenta{cuentas.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button type="button" onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded} aria-controls={idDetalle}
            aria-label={`${expanded ? 'Ocultar' : 'Ver'} cuentas vencidas de ${estudiante.nombre}`}
            className="w-11 h-11 shrink-0 rounded-xl bg-crema text-tinta-media flex items-center justify-center hover:bg-linea transition-colors">
            <Icono nombre="expand_more" className={`text-xl transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div id={idDetalle} className="mt-4 pt-4 border-t border-linea flex flex-col gap-3">
          <p className="text-[13px] font-semibold text-tinta-suave">Cuentas vencidas e historial de pagos</p>
          <ul className="flex flex-col gap-2.5">
            {cuentas.map((c) => <HistorialCuenta key={c.id_cuenta} cuenta={c} />)}
          </ul>
        </div>
      )}
    </article>
  );
};

export default DeudorCard;
