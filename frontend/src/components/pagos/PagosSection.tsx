// src/components/pagos/PagosSection.tsx
import TotalsBar from './TotalsBar';
import CuentaCard from './CuentaCard';
import { ESTADO_META, CONCEPTO_META, fmt } from './pagos.constants';
import type {
  ResumenPagos,
  CuentaCobro,
  Tarifa,
  EstadoCuenta,
} from '../../services/pagosApi';

interface PagosSectionProps {
  resumen:          ResumenPagos;
  cuentasFiltradas: CuentaCobro[];
  estadoFilter:     'TODOS' | EstadoCuenta;
  setEstadoFilter:  (v: 'TODOS' | EstadoCuenta) => void;
  onPagar:          (c: CuentaCobro) => void;
  onPension:        () => void;
  onMatricula:      () => void;
  onVolver:         () => void;
  year:             number;
  opLoading:        boolean;
  opError:          string;
  tarifa:           Tarifa | null;
  onEditTarifa:     () => void;
}

const PagosSection = ({
  resumen, cuentasFiltradas, estadoFilter, setEstadoFilter,
  onPagar, onPension, onMatricula, onVolver, year,
  opLoading, opError, tarifa, onEditTarifa,
}: PagosSectionProps) => {
  const { matricula, totales, cuentas } = resumen;

  const tieneMatricula  = cuentas.some((c) => c.concepto.nombre === 'MATRÍCULA');
  const tienePension    = cuentas.some((c) => c.concepto.nombre === 'PENSIÓN');
  const pagadasCount    = cuentas.filter((c) => c.estado === 'PAGADO').length;
  const pendienteCount  = cuentas.filter((c) => c.estado === 'PENDIENTE').length;

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      {/* Student header */}
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-on-surface-variant"
            title="Volver a la búsqueda"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center
            text-xs font-black text-on-primary-fixed-variant">
            {matricula.estudiante.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h3 className="font-semibold text-on-surface">{matricula.estudiante.nombre}</h3>
            <p className="text-xs text-stone-400">
              CC {matricula.estudiante.numero_identidad} · {matricula.grado.nombre} · {year}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {!tarifa && (
            <button onClick={onEditTarifa}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-100 text-orange-700
                border border-orange-200 rounded-lg text-xs font-bold hover:bg-orange-200 transition-all"
            >
              <span className="material-symbols-outlined text-base">warning</span>
              Configurar tarifas {year}
            </button>
          )}
          {!tieneMatricula && tarifa && (
            <button onClick={onMatricula} disabled={opLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-outline-variant
                text-on-surface-variant rounded-lg text-xs font-semibold hover:bg-stone-50
                transition-all disabled:opacity-60"
            >
              {opLoading
                ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-base text-blue-600">how_to_reg</span>
              }
              Crear matrícula · {fmt(tarifa.valor_matricula)}
            </button>
          )}
          {!tienePension && tarifa && (
            <button onClick={onPension} disabled={opLoading}
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

      {/* Op error */}
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
            { label: 'Total cuentas', value: cuentas.length, icon: 'receipt',       color: 'text-on-surface-variant' },
            { label: 'Pensiones',     value: cuentas.filter((c) => c.concepto.nombre === 'PENSIÓN').length, icon: 'payments', color: 'text-tertiary' },
            { label: 'Pagadas',       value: pagadasCount,   icon: 'check_circle',  color: 'text-secondary' },
            { label: 'Pendientes',    value: pendienteCount, icon: 'schedule',      color: 'text-primary' },
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

        {/* Totals */}
        <TotalsBar totales={totales} />

        {/* Estado filter chips */}
        <div className="flex gap-2 flex-wrap items-center">
          {(['TODOS', 'PENDIENTE', 'PAGADO', 'VENCIDO'] as const).map((f) => {
            const isActive = estadoFilter === f;
            const meta     = f === 'TODOS' ? null : ESTADO_META[f];
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
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black
                    ${isActive ? 'bg-white/20' : 'bg-stone-100 text-stone-500'}`}>
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

        {/* Cuenta list */}
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
            {(['MATRÍCULA', 'PENSIÓN'] as const).map((concepto) => {
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

export default PagosSection;