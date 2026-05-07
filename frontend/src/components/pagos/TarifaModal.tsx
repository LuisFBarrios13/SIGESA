// src/components/pagos/TarifaModal.tsx
import { useState, type FormEvent } from 'react';
import { fmt } from './pagos.constants';
import type { Tarifa } from '../../services/pagosApi';

interface TarifaModalProps {
  year:      number;
  tarifa:    Tarifa | null;
  opLoading: boolean;
  opError:   string;
  onConfirm: (valor_pension: number, valor_matricula: number) => void;
  onClose:   () => void;
}

const TarifaModal = ({
  year, tarifa, opLoading, opError, onConfirm, onClose,
}: TarifaModalProps) => {
  const [pension,   setPension]   = useState(tarifa ? String(Math.round(Number(tarifa.valor_pension)))   : '');
  const [matricula, setMatricula] = useState(tarifa ? String(Math.round(Number(tarifa.valor_matricula))) : '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(parseFloat(pension), parseFloat(matricula));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg">
              <span className="material-symbols-outlined text-xl text-on-surface-variant">price_change</span>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">
                {tarifa ? 'Editar tarifas' : 'Configurar tarifas'} {year}
              </h3>
              <p className="text-xs text-stone-400">
                Aplica a todos los estudiantes del año {year}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-lg transition-colors text-stone-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Error */}
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
                Total anual estimado (10 cuotas):{' '}
                <strong className="text-on-surface">{fmt(Number(pension) * 10)}</strong>
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
                <span className="text-on-surface">
                  {fmt(Number(pension) * 10 + Number(matricula))}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg
                font-semibold hover:bg-stone-50 transition-all text-sm"
            >
              Cancelar
            </button>
            <button type="submit" disabled={opLoading}
              className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-semibold
                hover:opacity-90 transition-all shadow-sm disabled:opacity-60
                flex items-center justify-center gap-2 text-sm"
            >
              {opLoading
                ? <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Guardando…</>
                : <><span className="material-symbols-outlined text-lg">save</span>
                    {tarifa ? 'Guardar cambios' : 'Configurar tarifas'}
                  </>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TarifaModal;