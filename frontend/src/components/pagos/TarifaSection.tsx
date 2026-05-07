// src/components/pagos/TarifaSection.tsx
import { fmt, yearOptions } from './pagos.constants';
import type { Tarifa } from '../../services/pagosApi';

interface TarifaSectionProps {
  tarifa:    Tarifa | null;
  year:      number;
  setYear:   (v: number) => void;
  isLoading: boolean;
  onEdit:    () => void;
}

const TarifaSection = ({ tarifa, year, setYear, isLoading, onEdit }: TarifaSectionProps) => (
  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
    {/* Header */}
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
            {/* Pensión */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="material-symbols-outlined text-purple-700 text-lg">payments</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Pensión mensual</p>
                <p className="text-xl font-semibold text-on-surface">{fmt(tarifa.valor_pension)}</p>
                <p className="text-[11px] text-stone-400">
                  × 10 meses = {fmt(Number(tarifa.valor_pension) * 10)}
                </p>
              </div>
            </div>
            <div className="w-px bg-stone-100" />
            {/* Matrícula */}
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
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant
              text-on-surface-variant rounded-lg text-sm font-semibold hover:bg-stone-50 transition-all"
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
              <p className="text-sm font-semibold text-on-surface">
                Sin tarifas configuradas para {year}
              </p>
              <p className="text-xs text-stone-400">
                Debes configurarlas antes de generar cuentas de cobro
              </p>
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

export default TarifaSection;