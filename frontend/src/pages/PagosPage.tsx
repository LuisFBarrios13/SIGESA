// src/pages/PagosPage.tsx

import { useState, type FormEvent } from 'react';
import { usePagos } from '../hooks/usePagos';
import type {
  CuentaCobro,
  Tarifa,
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
  PENDIENTE: { label: 'Pendiente', icon: 'schedule',     bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  PAGADO:    { label: 'Pagado',    icon: 'check_circle', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  VENCIDO:   { label: 'Vencido',   icon: 'cancel',       bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
};

const CONCEPTO_META: Record<string, { icon: string; bg: string; text: string }> = {
  'MATRÍCULA': { icon: 'how_to_reg', bg: 'bg-blue-100',   text: 'text-blue-700' },
  'PENSIÓN':   { icon: 'payments',   bg: 'bg-purple-100', text: 'text-purple-700' },
};

const fmt = (n: number | string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    .format(Number(n));

const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

// ── Primitivos compartidos ────────────────────────────────────

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

// ── 1. Sección de Tarifas ─────────────────────────────────────

interface TarifaSectionProps {
  tarifa: Tarifa | null;
  year: number;
  setYear: (v: number) => void;
  isLoading: boolean;
  onEdit: () => void;
}

const TarifaSection = ({ tarifa, year, setYear, isLoading, onEdit }: TarifaSectionProps) => (
  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-stone-100 rounded-lg">
          <span className="material-symbols-outlined text-xl text-on-surface-variant">price_change</span>
        </div>
        <div>
          <h3 className="font-semibold text-on-surface">Tarifas del año</h3>
          <p className="text-xs text-stone-500">Valores que aplican a todos los estudiantes</p>
        </div>
      </div>

      {/* Selector de año */}
      <select
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="px-3 py-2 rounded-lg border border-outline-variant bg-white text-sm
          focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer font-medium"
      >
        {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>

    <div className="p-6">
      {isLoading ? (
        <div className="flex items-center gap-3 text-stone-400">
          <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          <span className="text-sm">Cargando tarifas…</span>
        </div>
      ) : tarifa ? (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="material-symbols-outlined text-purple-700 text-lg">payments</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Pensión mensual</p>
                <p className="text-xl font-semibold text-on-surface">{fmt(tarifa.valor_pension)}</p>
                <p className="text-[11px] text-stone-400">× 10 meses = {fmt(Number(tarifa.valor_pension) * 10)}</p>
              </div>
            </div>
            <div className="w-px bg-stone-100" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="material-symbols-outlined text-blue-700 text-lg">how_to_reg</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Matrícula</p>
                <p className="text-xl font-semibold text-on-surface">{fmt(tarifa.valor_matricula)}</p>
                <p className="text-[11px] text-stone-400">Pago único al inicio</p>
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant text-on-surface-variant
              rounded-lg text-sm font-semibold hover:bg-stone-50 transition-all"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            Editar tarifas
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <span className="material-symbols-outlined text-orange-500 text-xl">warning</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Sin tarifas configuradas para {year}</p>
              <p className="text-xs text-stone-400">Debes configurarlas antes de generar cuentas de cobro</p>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary
              rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Configurar tarifas {year}
          </button>
        </div>
      )}
    </div>
  </div>
);

// ── 2. Sección de búsqueda ─────────────────────────────────────

interface SearchSectionProps {
  query: string;
  setQuery: (v: string) => void;
  results: MatriculaResumen[];
  isSearching: boolean;
  onSelect: (m: MatriculaResumen) => void;
}

const SearchSection = ({ query, setQuery, results, isSearching, onSelect }: SearchSectionProps) => (
  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
      <div className="p-2 bg-stone-100 rounded-lg">
        <span className="material-symbols-outlined text-xl text-on-surface-variant">manage_search</span>
      </div>
      <div>
        <h3 className="font-semibold text-on-surface">Buscar estudiante</h3>
        <p className="text-xs text-stone-500">Busca por nombre o número de identidad</p>
      </div>
    </div>

    <div className="p-6 space-y-4">
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
          <span className="material-symbols-outlined text-xl">search</span>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe nombre o cédula del estudiante…"
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-outline-variant bg-stone-50 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
        />
        {isSearching && (
          <span className="absolute inset-y-0 right-3 flex items-center">
            <span className="material-symbols-outlined text-primary animate-spin text-xl">progress_activity</span>
          </span>
        )}
      </div>

      {results.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-lg border border-outline-variant overflow-hidden">
          {results.map((m) => (
            <li key={m.id_matricula}>
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-stone-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 text-xs font-black text-on-primary-fixed-variant">
                  {m.estudiante.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                    {m.estudiante.nombre}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    CC {m.estudiante.numero_identidad} · {m.grado.nombre} · {m.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'} · {m.year}
                  </p>
                </div>
                <span className="material-symbols-outlined text-stone-300 group-hover:text-primary transition-colors">
                  arrow_forward
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.length >= 2 && !isSearching && results.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-stone-400">
          <span className="material-symbols-outlined text-4xl">person_search</span>
          <p className="text-sm">No se encontraron estudiantes con matrícula activa</p>
        </div>
      )}

      {!query && (
        <p className="text-center text-xs text-stone-400 py-2">Escribe al menos 2 caracteres para buscar</p>
      )}
    </div>
  </div>
);

// ── 3. Sección de pagos del estudiante ────────────────────────

const TotalsBar = ({ totales }: { totales: ResumenPagos['totales'] }) => (
  <div className="grid grid-cols-3 gap-4">
    {[
      { label: 'Total deuda',     value: totales.deuda,     icon: 'receipt_long',            bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-700' },
      { label: 'Total pagado',    value: totales.pagado,    icon: 'check_circle',            bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      { label: 'Saldo pendiente', value: totales.pendiente, icon: 'account_balance_wallet',
        bg:   totales.pendiente > 0 ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200',
        text: totales.pendiente > 0 ? 'text-orange-700' : 'text-emerald-700' },
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

interface CuentaCardProps {
  cuenta: CuentaCobro;
  onPagar: (c: CuentaCobro) => void;
}

const CuentaCard = ({ cuenta, onPagar }: CuentaCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const concMeta  = CONCEPTO_META[cuenta.concepto.nombre] ?? CONCEPTO_META['PENSIÓN'];
  const totalPagado = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
  const saldo = Math.max(0, Number(cuenta.valor_deuda) - totalPagado);
  const pct   = Math.min(100, Math.round((totalPagado / Number(cuenta.valor_deuda)) * 100));

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${
      cuenta.estado === 'PAGADO'  ? 'border-emerald-200 bg-emerald-50/30' :
      cuenta.estado === 'VENCIDO' ? 'border-red-200 bg-red-50/20' :
                                    'border-stone-200 bg-white'
    }`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${concMeta.bg}`}>
          <span className={`material-symbols-outlined text-lg ${concMeta.text}`}>{concMeta.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-on-surface">
              {cuenta.concepto.nombre === 'MATRÍCULA' ? `Matrícula ${cuenta.year}` : NOMBRE_MES[cuenta.mes]}
            </span>
            <EstadoBadge estado={cuenta.estado} />
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${cuenta.estado === 'PAGADO' ? 'bg-emerald-500' : 'bg-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-stone-400 font-bold w-8 text-right">{pct}%</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <MoneyText value={cuenta.valor_deuda} className="text-sm text-on-surface" />
          {saldo > 0 && (
            <p className="text-[11px] text-orange-600 font-semibold mt-0.5">Saldo: {fmt(saldo)}</p>
          )}
        </div>

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

      {expanded && cuenta.pagos.length > 0 && (
        <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/60 space-y-2">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Historial de pagos</p>
          {cuenta.pagos.map((p) => (
            <div key={p.id_pago} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-stone-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                <span className="text-stone-600">{new Date(p.fecha_pago).toLocaleDateString('es-CO')}</span>
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded font-medium">{p.metodo.nombre}</span>
              </div>
              <MoneyText value={p.monto_pago} className="text-secondary text-xs" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface PagosSectionProps {
  resumen: ResumenPagos;
  cuentasFiltradas: CuentaCobro[];
  estadoFilter: 'TODOS' | EstadoCuenta;
  setEstadoFilter: (v: 'TODOS' | EstadoCuenta) => void;
  onPagar: (c: CuentaCobro) => void;
  onPension: () => void;
  onMatricula: () => void;
  onVolver: () => void;
  year: number;
  opLoading: boolean;
  opError: string;
  tarifa: Tarifa | null;
  onEditTarifa: () => void;
}

const PagosSection = ({
  resumen, cuentasFiltradas, estadoFilter, setEstadoFilter,
  onPagar, onPension, onMatricula, onVolver, year,
  opLoading, opError, tarifa, onEditTarifa,
}: PagosSectionProps) => {
  const { matricula, totales, cuentas } = resumen;
  const tieneMatricula = cuentas.some((c) => c.concepto.nombre === 'MATRÍCULA');
  const tienePension   = cuentas.some((c) => c.concepto.nombre === 'PENSIÓN');
  const pagadasCount   = cuentas.filter((c) => c.estado === 'PAGADO').length;
  const pendienteCount = cuentas.filter((c) => c.estado === 'PENDIENTE').length;

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      {/* Cabecera estudiante */}
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-on-surface-variant"
            title="Volver a la búsqueda"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-black text-on-primary-fixed-variant">
            {matricula.estudiante.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h3 className="font-semibold text-on-surface">{matricula.estudiante.nombre}</h3>
            <p className="text-xs text-stone-400">
              CC {matricula.estudiante.numero_identidad} · {matricula.grado.nombre} · {year}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 flex-wrap">
          {!tarifa && (
            <button
              onClick={onEditTarifa}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-100 text-orange-700 border border-orange-200
                rounded-lg text-xs font-bold hover:bg-orange-200 transition-all"
            >
              <span className="material-symbols-outlined text-base">warning</span>
              Configurar tarifas {year}
            </button>
          )}
          {!tieneMatricula && tarifa && (
            <button
              onClick={onMatricula}
              disabled={opLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-outline-variant
                text-on-surface-variant rounded-lg text-xs font-semibold hover:bg-stone-50 transition-all disabled:opacity-60"
            >
              {opLoading
                ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-base text-blue-600">how_to_reg</span>
              }
              Crear matrícula · {fmt(tarifa.valor_matricula)}
            </button>
          )}
          {!tienePension && tarifa && (
            <button
              onClick={onPension}
              disabled={opLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-on-secondary
                rounded-lg text-xs font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-60"
            >
              {opLoading
                ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-base">playlist_add</span>
              }
              Generar pensiones · {fmt(tarifa.valor_pension)}/mes
            </button>
          )}
        </div>
      </div>

      {opError && (
        <div className="mx-6 mt-4 flex items-start gap-3 p-3 bg-error-container rounded-lg border border-error/20">
          <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
          <p className="text-sm text-error font-medium">{opError}</p>
        </div>
      )}

      <div className="p-6 space-y-5">
        {/* Mini stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total cuentas', value: cuentas.length,  icon: 'receipt',      color: 'text-on-surface-variant' },
            { label: 'Pensiones',     value: cuentas.filter(c => c.concepto.nombre === 'PENSIÓN').length, icon: 'payments', color: 'text-tertiary' },
            { label: 'Pagadas',       value: pagadasCount,    icon: 'check_circle', color: 'text-secondary' },
            { label: 'Pendientes',    value: pendienteCount,  icon: 'schedule',     color: 'text-primary' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
              <div>
                <p className="text-lg font-bold text-on-surface leading-none">{value}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Totales */}
        <TotalsBar totales={totales} />

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap items-center">
          {(['TODOS', 'PENDIENTE', 'PAGADO', 'VENCIDO'] as const).map((f) => {
            const isActive = estadoFilter === f;
            const meta = f === 'TODOS' ? null : ESTADO_META[f];
            return (
              <button
                key={f}
                onClick={() => setEstadoFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all
                  ${isActive
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/40'
                  }`}
              >
                {meta && <span className="material-symbols-outlined text-[13px]">{meta.icon}</span>}
                {f === 'TODOS' ? 'Todas' : meta!.label}
                {f !== 'TODOS' && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20' : 'bg-stone-100 text-stone-500'}`}>
                    {cuentas.filter((c) => c.estado === f).length}
                  </span>
                )}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-stone-400">
            {cuentasFiltradas.length} de {cuentas.length}
          </span>
        </div>

        {/* Lista de cuentas */}
        {cuentas.length === 0 ? (
          <div className="bg-stone-50 border border-stone-100 rounded-xl p-10 flex flex-col items-center gap-3 text-stone-400">
            <span className="material-symbols-outlined text-5xl">receipt_long</span>
            <p className="text-sm font-medium">No hay cuentas de cobro generadas</p>
            {!tarifa
              ? <p className="text-xs text-primary font-semibold">Configura las tarifas del año para poder generar cuentas</p>
              : <p className="text-xs">Usa los botones de arriba para crear la matrícula y/o generar las pensiones</p>
            }
          </div>
        ) : cuentasFiltradas.length === 0 ? (
          <div className="bg-stone-50 border border-stone-100 rounded-xl p-8 flex flex-col items-center gap-2 text-stone-400">
            <span className="material-symbols-outlined text-4xl">filter_alt_off</span>
            <p className="text-sm">No hay cuentas con ese estado</p>
          </div>
        ) : (
          <div className="space-y-4">
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

  const [monto, setMonto]   = useState(saldo.toFixed(0));
  const [metodo, setMetodo] = useState(metodos[0]?.id_metodo?.toString() ?? '');
  const [fecha, setFecha]   = useState(new Date().toISOString().split('T')[0]);
  const [obs, setObs]       = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(parseFloat(monto), Number(metodo), fecha, obs || undefined);
  };

  const concMeta = CONCEPTO_META[cuenta.concepto.nombre] ?? CONCEPTO_META['PENSIÓN'];

  const ICONS: Record<string, string> = {
    EFECTIVO: 'payments', TRANSFERENCIA: 'swap_horiz',
    CONSIGNACIÓN: 'account_balance', TARJETA: 'credit_card',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${concMeta.bg} rounded-lg`}>
              <span className={`material-symbols-outlined text-xl ${concMeta.text}`}>{concMeta.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">Registrar pago</h3>
              <p className="text-xs text-stone-400">
                {cuenta.concepto.nombre === 'MATRÍCULA'
                  ? `Matrícula ${cuenta.year}`
                  : `${NOMBRE_MES[cuenta.mes]} ${cuenta.year}`}
                {' · '}Saldo: {fmt(saldo)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-lg transition-colors text-stone-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {(opError || metodosError) && (
          <div className="mx-5 mt-4 flex items-start gap-3 p-3 bg-error-container rounded-lg border border-error/20">
            <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
            <p className="text-sm text-error font-medium">{opError || metodosError}</p>
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
                type="number" min="1" step="any" value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-outline-variant bg-stone-50 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
                required
              />
            </div>
            <div className="flex gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button key={pct} type="button"
                  onClick={() => setMonto(Math.round(saldo * pct / 100).toString())}
                  className="flex-1 py-1.5 text-xs bg-stone-100 text-stone-600 rounded-lg hover:bg-primary-fixed hover:text-on-primary-fixed-variant transition-all font-semibold"
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
                const isSelected = metodo === String(m.id_metodo);
                return (
                  <button key={m.id_metodo} type="button" onClick={() => setMetodo(String(m.id_metodo))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-semibold
                      ${isSelected
                        ? 'border-primary bg-primary-fixed/20 text-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                      }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-primary' : 'text-stone-400'}`}>
                      {ICONS[m.nombre] ?? 'payment'}
                    </span>
                    {m.nombre}
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-sm ml-auto">check_circle</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Fecha de pago</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-stone-50 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
            />
          </div>

          {/* Observaciones */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Observaciones</label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
              placeholder="Número de recibo, referencia, etc."
              className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-stone-50 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all resize-none placeholder:text-stone-400"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg font-semibold hover:bg-stone-50 transition-all text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={opLoading || !metodo || metodos.length === 0}
              className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-semibold
                hover:opacity-90 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
              {opLoading
                ? <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Guardando…</>
                : <><span className="material-symbols-outlined text-lg">add_card</span>Registrar pago</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Modal: Configurar Tarifa ──────────────────────────────────

interface TarifaModalProps {
  year: number;
  tarifa: Tarifa | null;
  opLoading: boolean;
  opError: string;
  onConfirm: (valor_pension: number, valor_matricula: number) => void;
  onClose: () => void;
}

const TarifaModal = ({ year, tarifa, opLoading, opError, onConfirm, onClose }: TarifaModalProps) => {
  const [pension, setPension]     = useState(tarifa ? String(Math.round(Number(tarifa.valor_pension))) : '');
  const [matricula, setMatricula] = useState(tarifa ? String(Math.round(Number(tarifa.valor_matricula))) : '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(parseFloat(pension), parseFloat(matricula));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg">
              <span className="material-symbols-outlined text-xl text-on-surface-variant">price_change</span>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">
                {tarifa ? 'Editar tarifas' : 'Configurar tarifas'} {year}
              </h3>
              <p className="text-xs text-stone-400">Aplica a todos los estudiantes del año {year}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-lg transition-colors text-stone-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {opError && (
          <div className="mx-5 mt-4 flex items-start gap-3 p-3 bg-error-container rounded-lg border border-error/20">
            <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
            <p className="text-sm text-error font-medium">{opError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Pensión */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-base">payments</span>
              Valor mensual de pensión <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 font-bold text-sm">$</span>
              <input
                type="number" min="0" step="1000" value={pension}
                onChange={(e) => setPension(e.target.value)}
                placeholder="ej. 150000"
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-outline-variant bg-stone-50 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
                required
              />
            </div>
            {pension && (
              <p className="text-xs text-stone-400 bg-stone-50 rounded-lg px-3 py-2">
                Total anual estimado (10 cuotas): <strong className="text-on-surface">{fmt(Number(pension) * 10)}</strong>
              </p>
            )}
          </div>

          {/* Matrícula */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">how_to_reg</span>
              Valor de matrícula (pago único) <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 font-bold text-sm">$</span>
              <input
                type="number" min="0" step="1000" value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="ej. 200000"
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-outline-variant bg-stone-50 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Resumen */}
          {pension && matricula && (
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 space-y-2">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Resumen {year}</p>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Pensión mensual</span>
                <strong className="text-on-surface">{fmt(pension)}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Matrícula (una vez)</span>
                <strong className="text-on-surface">{fmt(matricula)}</strong>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-bold">
                <span className="text-stone-500">Total año completo</span>
                <span className="text-on-surface">{fmt(Number(pension) * 10 + Number(matricula))}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg font-semibold hover:bg-stone-50 transition-all text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={opLoading}
              className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-semibold
                hover:opacity-90 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
              {opLoading
                ? <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Guardando…</>
                : <><span className="material-symbols-outlined text-lg">save</span>{tarifa ? 'Guardar cambios' : 'Configurar tarifas'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────

const PagosPage = () => {
  const {
    searchQuery, setSearchQuery,
    yearFilter, setYearFilter,
    searchResults, isSearching,
    selectedMatricula, resumen, isLoadingResumen,
    selectMatricula, clearSelection,
    metodos, metodosError,
    tarifa, isTarifaLoading, openTarifaModal,
    modal, openPagoModal, closeModal,
    opLoading, opError,
    registrarPago, generarPension, crearMatricula, saveTarifa,
    estadoFilter, setEstadoFilter, cuentasFiltradas,
  } = usePagos();

  return (
    <>
      {/* Modals */}
      {modal?.type === 'pago' && (
        <PagoModal
          cuenta={modal.cuenta}
          metodos={metodos}
          metodosError={metodosError}
          opLoading={opLoading}
          opError={opError}
          onConfirm={registrarPago}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'tarifa' && (
        <TarifaModal
          year={modal.year}
          tarifa={modal.tarifa}
          opLoading={opLoading}
          opError={opError}
          onConfirm={saveTarifa}
          onClose={closeModal}
        />
      )}

      {/* Page header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Gestión de Pagos</h1>
          <p className="text-base text-stone-500 mt-1">
            Configura las tarifas del año y gestiona los cobros de cada estudiante
          </p>
        </div>
      </div>

      {/* Layout vertical único */}
      <div className="space-y-5">
        {/* 1. Tarifas */}
        <TarifaSection
          tarifa={tarifa}
          year={yearFilter}
          setYear={setYearFilter}
          isLoading={isTarifaLoading}
          onEdit={openTarifaModal}
        />

        {/* 2. Búsqueda (solo cuando no hay estudiante seleccionado) */}
        {!resumen && !isLoadingResumen && (
          <SearchSection
            query={searchQuery}
            setQuery={setSearchQuery}
            results={searchResults}
            isSearching={isSearching}
            onSelect={selectMatricula}
          />
        )}

        {/* 3. Spinner de carga */}
        {isLoadingResumen && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm
            flex items-center justify-center min-h-[200px] gap-3 text-stone-400">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
            <p className="text-sm">Cargando información de pagos…</p>
          </div>
        )}

        {/* 4. Pagos del estudiante */}
        {resumen && (
          <PagosSection
            resumen={resumen}
            cuentasFiltradas={cuentasFiltradas}
            estadoFilter={estadoFilter}
            setEstadoFilter={setEstadoFilter}
            onPagar={openPagoModal}
            onPension={generarPension}
            onMatricula={crearMatricula}
            onVolver={clearSelection}
            year={yearFilter}
            opLoading={opLoading}
            opError={opError}
            tarifa={tarifa}
            onEditTarifa={openTarifaModal}
          />
        )}
      </div>
    </>
  );
};

export default PagosPage;