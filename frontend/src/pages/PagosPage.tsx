// src/pages/PagosPage.tsx
// Dependency Inversion: page only calls the hook and renders components.

import { useState, type FormEvent } from 'react';
import { usePagos } from '../hooks/usePagos';
import type {
  CuentaCobro,
  MetodoPago,
  EstadoCuenta,
  ResumenPagos,
  MatriculaResumen,
} from '../services/pagosApi';
import type { ModalKind } from '../hooks/usePagos';

// ── Constants ─────────────────────────────────────────────────

const NOMBRE_MES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

const ESTADO_META: Record<EstadoCuenta, { label: string; icon: string; bg: string; text: string; border: string }> = {
  PENDIENTE: { label: 'Pendiente', icon: 'schedule',      bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200' },
  PAGADO:    { label: 'Pagado',    icon: 'check_circle',  bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200' },
  VENCIDO:   { label: 'Vencido',   icon: 'cancel',        bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200' },
};

const CONCEPTO_META: Record<string, { icon: string; bg: string; text: string }> = {
  'MATRÍCULA': { icon: 'how_to_reg', bg: 'bg-blue-100',   text: 'text-blue-700' },
  'PENSIÓN':   { icon: 'payments',   bg: 'bg-purple-100', text: 'text-purple-700' },
};

const fmt = (n: number | string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    .format(Number(n));

const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

// ── Shared primitives ─────────────────────────────────────────

const EstadoBadge = ({ estado }: { estado: EstadoCuenta }) => {
  const m = ESTADO_META[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${m.bg} ${m.text} ${m.border}`}>
      <span className="material-symbols-outlined text-[13px]">{m.icon}</span>
      {m.label}
    </span>
  );
};

const MoneyText = ({ value, className = '' }: { value: number | string; className?: string }) => (
  <span className={`font-bold tabular-nums ${className}`}>{fmt(value)}</span>
);

// ── Search Panel ──────────────────────────────────────────────

interface SearchPanelProps {
  query: string;
  setQuery: (v: string) => void;
  year: number;
  setYear: (v: number) => void;
  results: MatriculaResumen[];
  isSearching: boolean;
  onSelect: (m: MatriculaResumen) => void;
}

const SearchPanel = ({
  query, setQuery, year, setYear, results, isSearching, onSelect,
}: SearchPanelProps) => (
  <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
    <div className="px-6 py-4 bg-gradient-to-r from-orange-900 to-orange-800 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-white text-xl">manage_search</span>
      </div>
      <div>
        <h2 className="font-bold text-white">Buscar Estudiante</h2>
        <p className="text-xs text-orange-200/70">Busca por nombre o número de identidad</p>
      </div>
    </div>

    <div className="p-5 space-y-4">
      <div className="flex gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
            <span className="material-symbols-outlined text-xl">search</span>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o cédula del estudiante…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-stone-50 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {isSearching && (
            <span className="absolute inset-y-0 right-3 flex items-center">
              <span className="material-symbols-outlined text-primary animate-spin text-xl">progress_activity</span>
            </span>
          )}
        </div>

        {/* Year filter */}
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2.5 rounded-xl border border-outline-variant bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-xl border border-outline-variant overflow-hidden">
          {results.map((m) => (
            <li key={m.id_matricula}>
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-orange-50/60 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-on-primary-fixed-variant">
                    {m.estudiante.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                    {m.estudiante.nombre}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    CC {m.estudiante.numero_identidad} · {m.grado.nombre} · Jornada {m.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'} · {m.year}
                  </p>
                </div>
                <span className="material-symbols-outlined text-stone-300 group-hover:text-primary transition-colors text-xl">
                  arrow_forward
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.length >= 2 && !isSearching && results.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
          <span className="material-symbols-outlined text-4xl">person_search</span>
          <p className="text-sm">No se encontraron estudiantes con matrícula activa</p>
        </div>
      )}
    </div>
  </div>
);

// ── Totals Bar ────────────────────────────────────────────────

const TotalsBar = ({ totales }: { totales: ResumenPagos['totales'] }) => (
  <div className="grid grid-cols-3 gap-4">
    {[
      { label: 'Total deuda', value: totales.deuda,     icon: 'receipt_long', bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-700' },
      { label: 'Total pagado', value: totales.pagado,   icon: 'check_circle', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      { label: 'Saldo pendiente', value: totales.pendiente, icon: 'account_balance_wallet', bg: totales.pendiente > 0 ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200', text: totales.pendiente > 0 ? 'text-orange-700' : 'text-emerald-700' },
    ].map(({ label, value, icon, bg, text }) => (
      <div key={label} className={`p-4 rounded-xl border ${bg} flex items-center gap-3`}>
        <span className={`material-symbols-outlined text-2xl ${text}`}>{icon}</span>
        <div>
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">{label}</p>
          <MoneyText value={value} className={`text-lg ${text}`} />
        </div>
      </div>
    ))}
  </div>
);

// ── Cuenta Card ───────────────────────────────────────────────

interface CuentaCardProps {
  cuenta: CuentaCobro;
  onPagar: (c: CuentaCobro) => void;
}

const CuentaCard = ({ cuenta, onPagar }: CuentaCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const meta = ESTADO_META[cuenta.estado];
  const concMeta = CONCEPTO_META[cuenta.concepto.nombre] ?? CONCEPTO_META['PENSIÓN'];
  const totalPagado = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
  const saldo = Math.max(0, Number(cuenta.valor_deuda) - totalPagado);
  const pct = Math.min(100, Math.round((totalPagado / Number(cuenta.valor_deuda)) * 100));

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${
      cuenta.estado === 'PAGADO'   ? 'border-emerald-200 bg-emerald-50/30' :
      cuenta.estado === 'VENCIDO'  ? 'border-red-200 bg-red-50/20' :
                                     'border-stone-200 bg-white'
    }`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${concMeta.bg}`}>
          <span className={`material-symbols-outlined text-lg ${concMeta.text}`}>{concMeta.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-on-surface">
              {cuenta.concepto.nombre === 'MATRÍCULA'
                ? `Matrícula ${cuenta.year}`
                : NOMBRE_MES[cuenta.mes]}
            </span>
            <EstadoBadge estado={cuenta.estado} />
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${cuenta.estado === 'PAGADO' ? 'bg-emerald-500' : 'bg-orange-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-stone-400 font-bold w-8 text-right">{pct}%</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <MoneyText value={cuenta.valor_deuda} className="text-sm text-on-surface" />
          {saldo > 0 && (
            <p className="text-[11px] text-orange-600 font-semibold mt-0.5">
              Saldo: {fmt(saldo)}
            </p>
          )}
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          {cuenta.estado !== 'PAGADO' && (
            <button
              onClick={() => onPagar(cuenta)}
              className="px-3 py-1.5 bg-orange-900 text-white rounded-lg text-xs font-bold
                hover:bg-primary transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">add_card</span>
              Pagar
            </button>
          )}
          {cuenta.pagos.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-stone-400 hover:text-primary hover:bg-stone-100 rounded-lg transition-all"
              title="Ver pagos"
            >
              <span className="material-symbols-outlined text-lg">
                {expanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Pagos expandibles */}
      {expanded && cuenta.pagos.length > 0 && (
        <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/60 space-y-2">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            Historial de pagos
          </p>
          {cuenta.pagos.map((p) => (
            <div key={p.id_pago} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-stone-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span className="text-stone-600">{new Date(p.fecha_pago).toLocaleDateString('es-CO')}</span>
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded font-medium">
                  {p.metodo.nombre}
                </span>
              </div>
              <MoneyText value={p.monto_pago} className="text-emerald-700 text-xs" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Resumen Panel ─────────────────────────────────────────────

interface ResumenPanelProps {
  resumen: ResumenPagos;
  cuentasFiltradas: CuentaCobro[];
  estadoFilter: 'TODOS' | EstadoCuenta;
  setEstadoFilter: (v: 'TODOS' | EstadoCuenta) => void;
  onPagar: (c: CuentaCobro) => void;
  onPension: () => void;
  onMatricula: () => void;
  onVolver: () => void;
  year: number;
}

const ResumenPanel = ({
  resumen, cuentasFiltradas, estadoFilter, setEstadoFilter,
  onPagar, onPension, onMatricula, onVolver, year,
}: ResumenPanelProps) => {
  const { matricula, totales, cuentas } = resumen;

  const tieneMatricula = cuentas.some((c) => c.concepto.nombre === 'MATRÍCULA');
  const tienePension   = cuentas.some((c) => c.concepto.nombre === 'PENSIÓN');

  const pensionCount  = cuentas.filter((c) => c.concepto.nombre === 'PENSIÓN').length;
  const pagadasCount  = cuentas.filter((c) => c.estado === 'PAGADO').length;
  const pendienteCount = cuentas.filter((c) => c.estado === 'PENDIENTE').length;

  return (
    <div className="space-y-5">
      {/* Student header card */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-900 to-orange-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onVolver}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
            </button>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-black text-lg">
                {matricula.estudiante.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{matricula.estudiante.nombre}</h2>
              <p className="text-xs text-orange-200/70">
                CC {matricula.estudiante.numero_identidad} · {matricula.grado.nombre} · {year}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {!tieneMatricula && (
              <button
                onClick={onMatricula}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all"
              >
                <span className="material-symbols-outlined text-base">how_to_reg</span>
                Crear Matrícula
              </button>
            )}
            {!tienePension && (
              <button
                onClick={onPension}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-base">playlist_add</span>
                Generar Pensiones
              </button>
            )}
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-4 divide-x divide-stone-100 border-t border-stone-100">
          {[
            { label: 'Total cuentas', value: cuentas.length,     icon: 'receipt', color: 'text-stone-600' },
            { label: 'Pensiones',     value: pensionCount,       icon: 'payments', color: 'text-purple-600' },
            { label: 'Pagadas',       value: pagadasCount,       icon: 'check_circle', color: 'text-emerald-600' },
            { label: 'Pendientes',    value: pendienteCount,     icon: 'schedule', color: 'text-orange-600' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="px-4 py-3 flex items-center gap-3">
              <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
              <div>
                <p className="text-xl font-bold text-on-surface leading-none">{value}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <TotalsBar totales={totales} />

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(['TODOS', 'PENDIENTE', 'PAGADO', 'VENCIDO'] as const).map((f) => {
          const isActive = estadoFilter === f;
          const meta = f === 'TODOS' ? null : ESTADO_META[f];
          return (
            <button
              key={f}
              onClick={() => setEstadoFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all
                ${isActive
                  ? 'bg-orange-900 text-white border-orange-900 shadow-sm'
                  : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/40'
                }`}
            >
              {meta && <span className="material-symbols-outlined text-[13px]">{meta.icon}</span>}
              {f === 'TODOS' ? 'Todas' : meta!.label}
              {f !== 'TODOS' && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20' : 'bg-stone-100 text-stone-600'}`}>
                  {cuentas.filter((c) => c.estado === f).length}
                </span>
              )}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-stone-400 self-center">
          {cuentasFiltradas.length} de {cuentas.length}
        </span>
      </div>

      {/* Cuentas list */}
      {cuentas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-outline-variant p-12 flex flex-col items-center gap-3 text-stone-400">
          <span className="material-symbols-outlined text-5xl">receipt_long</span>
          <p className="text-sm font-medium">No hay cuentas de cobro generadas</p>
          <p className="text-xs">Usa los botones de arriba para crear la matrícula y/o generar las pensiones</p>
        </div>
      ) : cuentasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-outline-variant p-8 flex flex-col items-center gap-2 text-stone-400">
          <span className="material-symbols-outlined text-4xl">filter_alt_off</span>
          <p className="text-sm">No hay cuentas con ese estado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Group by concepto */}
          {['MATRÍCULA', 'PENSIÓN'].map((concepto) => {
            const grupo = cuentasFiltradas.filter((c) => c.concepto.nombre === concepto);
            if (grupo.length === 0) return null;
            const cm = CONCEPTO_META[concepto];
            return (
              <div key={concepto}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cm.bg} mb-2`}>
                  <span className={`material-symbols-outlined text-base ${cm.text}`}>{cm.icon}</span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${cm.text}`}>{concepto}</span>
                </div>
                <div className="space-y-2">
                  {grupo.map((c) => (
                    <CuentaCard key={c.id_cuenta} cuenta={c} onPagar={onPagar} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Modal: Registrar Pago ─────────────────────────────────────

interface PagoModalProps {
  cuenta: CuentaCobro;
  metodos: MetodoPago[];
  metodosError: string;
  opLoading: boolean;
  opError: string;
  onConfirm: (monto: number, id_metodo: number, fecha?: string, obs?: string) => void;
  onClose: () => void;
}

const PagoModal = ({ cuenta, metodos, metodosError, opLoading, opError, onConfirm, onClose }: PagoModalProps) => {
  const totalPagado = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
  const saldo = Math.max(0, Number(cuenta.valor_deuda) - totalPagado);

  const [monto, setMonto]     = useState(saldo.toFixed(0));
  const [metodo, setMetodo]   = useState(metodos[0]?.id_metodo?.toString() ?? '');
  const [fecha, setFecha]     = useState(new Date().toISOString().split('T')[0]);
  const [obs, setObs]         = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(parseFloat(monto), Number(metodo), fecha, obs || undefined);
  };

  const concMeta = CONCEPTO_META[cuenta.concepto.nombre] ?? CONCEPTO_META['PENSIÓN'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-900 to-orange-800 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${concMeta.bg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-xl ${concMeta.text}`}>{concMeta.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Registrar Pago</h3>
              <p className="text-xs text-orange-200/70">
                {cuenta.concepto.nombre === 'MATRÍCULA'
                  ? `Matrícula ${cuenta.year}`
                  : `${NOMBRE_MES[cuenta.mes]} ${cuenta.year}`}
                {' · '}Saldo: {fmt(saldo)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        {opError && (
          <div className="mx-5 mt-4 flex items-start gap-3 p-3 bg-error-container rounded-xl border border-error/20">
            <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
            <p className="text-sm text-error font-medium">{opError}</p>
          </div>
        )}

        {metodosError && (
          <div className="mx-5 mt-4 flex items-start gap-3 p-3 bg-error-container rounded-xl border border-error/20">
            <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
            <p className="text-sm text-error font-medium">{metodosError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Monto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Monto a pagar <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 font-bold text-sm">$</span>
              <input
                type="number"
                min="0"
                max={saldo}
                step="1000"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                required
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setMonto(Math.round(saldo * pct / 100).toString())}
                  className="px-2.5 py-1 text-xs bg-stone-100 text-stone-600 rounded-lg hover:bg-primary-fixed hover:text-on-primary-fixed-variant transition-all font-semibold"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Método */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Método de pago <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {metodos.map((m) => {
                const icons: Record<string, string> = {
                  EFECTIVO: 'payments', TRANSFERENCIA: 'swap_horiz',
                  CONSIGNACIÓN: 'account_balance', TARJETA: 'credit_card',
                };
                const isSelected = metodo === String(m.id_metodo);
                return (
                  <button
                    key={m.id_metodo}
                    type="button"
                    onClick={() => setMetodo(String(m.id_metodo))}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-semibold
                      ${isSelected
                        ? 'border-primary bg-primary-fixed/20 text-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                      }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-primary' : 'text-stone-400'}`}>
                      {icons[m.nombre] ?? 'payment'}
                    </span>
                    {m.nombre}
                    {isSelected && <span className="material-symbols-outlined text-primary text-base ml-auto">check_circle</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Fecha de pago
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Observaciones */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Observaciones
            </label>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
              placeholder="Número de recibo, referencia, etc."
              className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none placeholder:text-stone-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-semibold hover:bg-stone-50 transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={opLoading || !metodo || metodos.length === 0}
              className="flex-1 py-3 bg-orange-900 text-white rounded-xl font-semibold
                hover:bg-primary transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {opLoading ? (
                <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Guardando...</>
              ) : (
                <><span className="material-symbols-outlined text-lg">add_card</span>Registrar Pago</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Modal: Generar Pensiones ──────────────────────────────────

interface PensionModalProps {
  year: number;
  opLoading: boolean;
  opError: string;
  onConfirm: (valor: number) => void;
  onClose: () => void;
}

const PensionModal = ({ year, opLoading, opError, onConfirm, onClose }: PensionModalProps) => {
  const [valor, setValor] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(parseFloat(valor));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">playlist_add</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Generar Pensiones {year}</h3>
              <p className="text-xs text-purple-200/80">Febrero a Noviembre (10 meses)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full">
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        {opError && (
          <div className="mx-5 mt-4 flex items-start gap-3 p-3 bg-error-container rounded-xl border border-error/20">
            <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
            <p className="text-sm text-error font-medium">{opError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Valor mensual de pensión <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 font-bold text-sm">$</span>
              <input
                type="number"
                min="1000"
                step="1000"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="ej. 150000"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition-all"
                required
              />
            </div>
            {valor && (
              <p className="text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2">
                Total anual estimado:{' '}
                <strong className="text-purple-700">
                  {fmt(parseFloat(valor) * 10)}
                </strong>{' '}
                (10 cuotas)
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant rounded-xl text-sm font-semibold hover:bg-stone-50 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={opLoading}
              className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-semibold
                hover:bg-purple-600 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
              {opLoading
                ? <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Generando...</>
                : <><span className="material-symbols-outlined text-lg">add</span>Generar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Modal: Crear Cuenta Matrícula ─────────────────────────────

interface MatriculaModalProps {
  year: number;
  opLoading: boolean;
  opError: string;
  onConfirm: (valor: number) => void;
  onClose: () => void;
}

const MatriculaModal = ({ year, opLoading, opError, onConfirm, onClose }: MatriculaModalProps) => {
  const [valor, setValor] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(parseFloat(valor));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">how_to_reg</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cuenta de Matrícula {year}</h3>
              <p className="text-xs text-blue-200/80">Pago único de ingreso</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full">
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        {opError && (
          <div className="mx-5 mt-4 flex items-start gap-3 p-3 bg-error-container rounded-xl border border-error/20">
            <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
            <p className="text-sm text-error font-medium">{opError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Valor de la matrícula <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 font-bold text-sm">$</span>
              <input
                type="number"
                min="1000"
                step="1000"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="ej. 200000"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant rounded-xl text-sm font-semibold hover:bg-stone-50 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={opLoading}
              className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-semibold
                hover:bg-blue-600 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
              {opLoading
                ? <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Creando...</>
                : <><span className="material-symbols-outlined text-lg">add</span>Crear</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Render modal helper (Open/Closed) ─────────────────────────

const renderModal = (
  modal: ModalKind,
  metodos: MetodoPago[],
  metodosError: string,
  opLoading: boolean,
  opError: string,
  handlers: {
    registrarPago: (m: number, met: number, f?: string, o?: string) => void;
    generarPension: (v: number) => void;
    crearMatricula: (v: number) => void;
    closeModal: () => void;
  },
) => {
  if (!modal) return null;
  if (modal.type === 'pago') {
    return (
      <PagoModal
        cuenta={modal.cuenta}
        metodos={metodos}
        metodosError={metodosError}
        opLoading={opLoading}
        opError={opError}
        onConfirm={handlers.registrarPago}
        onClose={handlers.closeModal}
      />
    );
  }
  if (modal.type === 'pension') {
    return (
      <PensionModal
        year={modal.year}
        opLoading={opLoading}
        opError={opError}
        onConfirm={handlers.generarPension}
        onClose={handlers.closeModal}
      />
    );
  }
  if (modal.type === 'matricula') {
    return (
      <MatriculaModal
        year={modal.year}
        opLoading={opLoading}
        opError={opError}
        onConfirm={handlers.crearMatricula}
        onClose={handlers.closeModal}
      />
    );
  }
  return null;
};

// ── Main Page ─────────────────────────────────────────────────

const PagosPage = () => {
  const {
    searchQuery, setSearchQuery,
    yearFilter, setYearFilter,
    searchResults, isSearching,
    selectedMatricula, resumen, isLoadingResumen,
    selectMatricula, clearSelection,
    metodos,
    metodosError,
    modal, openPagoModal, openPensionModal, openMatriculaModal, closeModal,
    opLoading, opError,
    registrarPago, generarPension, crearMatricula,
    estadoFilter, setEstadoFilter, cuentasFiltradas,
  } = usePagos();

  return (
    <>
      {/* Modals */}
      {renderModal(modal, metodos, metodosError, opLoading, opError, {
        registrarPago,
        generarPension,
        crearMatricula,
        closeModal,
      })}

      {/* Page header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Gestión de Pagos</h1>
          <p className="text-base text-stone-500 mt-1">
            Registra matrículas, pensiones y controla el estado de pago de cada estudiante
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
        {/* ── Left: search (always visible) ──────────────────── */}
        <div className="space-y-5">
          <SearchPanel
            query={searchQuery}
            setQuery={setSearchQuery}
            year={yearFilter}
            setYear={setYearFilter}
            results={searchResults}
            isSearching={isSearching}
            onSelect={selectMatricula}
          />

          {/* Legend */}
          <div className="bg-white rounded-2xl border border-outline-variant p-5 space-y-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Cómo funciona
            </p>
            {[
              { icon: 'search', text: 'Busca al estudiante por nombre o cédula', color: 'text-stone-500' },
              { icon: 'playlist_add', text: 'Genera las 10 cuotas de pensión (feb–nov)', color: 'text-purple-600' },
              { icon: 'how_to_reg', text: 'Crea la cuenta de matrícula si aplica', color: 'text-blue-600' },
              { icon: 'add_card', text: 'Registra cada pago con su método y fecha', color: 'text-emerald-600' },
            ].map(({ icon, text, color }) => (
              <div key={icon} className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
                <p className="text-xs text-stone-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: resumen o placeholder ────────────────────── */}
        {isLoadingResumen ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
              <p className="text-stone-400 text-sm">Cargando información de pagos…</p>
            </div>
          </div>
        ) : resumen ? (
          <ResumenPanel
            resumen={resumen}
            cuentasFiltradas={cuentasFiltradas}
            estadoFilter={estadoFilter}
            setEstadoFilter={setEstadoFilter}
            onPagar={openPagoModal}
            onPension={openPensionModal}
            onMatricula={openMatriculaModal}
            onVolver={clearSelection}
            year={yearFilter}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-outline-variant shadow-sm flex flex-col items-center justify-center min-h-[400px] gap-4 p-10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-300 text-5xl">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Selecciona un estudiante</h3>
              <p className="text-sm text-stone-400 mt-1 max-w-xs">
                Busca al estudiante en el panel izquierdo para ver su estado de cuenta y registrar pagos
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PagosPage;