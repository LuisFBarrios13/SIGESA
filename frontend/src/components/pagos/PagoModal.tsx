// src/components/pagos/PagoModal.tsx
import { useState, type FormEvent } from 'react';
import { NOMBRE_MES, CONCEPTO_META, METODO_ICONS, fmt } from './pagos.constants';
import type { CuentaCobro, MetodoPago } from '../../services/pagosApi';

interface PagoModalProps {
  cuenta:       CuentaCobro;
  metodos:      MetodoPago[];
  metodosError: string;
  opLoading:    boolean;
  opError:      string;
  onConfirm:    (monto: number, id_metodo: number, fecha?: string, obs?: string) => void;
  onClose:      () => void;
}

const PagoModal = ({
  cuenta, metodos, metodosError, opLoading, opError, onConfirm, onClose,
}: PagoModalProps) => {
  const totalPagado = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
  const saldo       = Math.max(0, Number(cuenta.valor_deuda) - totalPagado);

  const [monto,  setMonto]  = useState(saldo.toFixed(0));
  const [metodo, setMetodo] = useState(metodos[0]?.id_metodo?.toString() ?? '');
  const [fecha,  setFecha]  = useState(new Date().toISOString().split('T')[0]);
  const [obs,    setObs]    = useState('');

  const concMeta = CONCEPTO_META[cuenta.concepto.nombre] ?? CONCEPTO_META['PENSIÓN'];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(parseFloat(monto), Number(metodo), fecha, obs || undefined);
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
                  : `${NOMBRE_MES[cuenta.mes]} ${cuenta.year}`
                }
                {' · '}Saldo: {fmt(saldo)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-lg transition-colors text-stone-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Errors */}
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
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  focus:bg-white transition-all"
                required
              />
            </div>
            {/* Quick % buttons */}
            <div className="flex gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button key={pct} type="button"
                  onClick={() => setMonto(Math.round(saldo * pct / 100).toString())}
                  className="flex-1 py-1.5 text-xs bg-stone-100 text-stone-600 rounded-lg
                    hover:bg-primary-fixed hover:text-on-primary-fixed-variant transition-all font-semibold"
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
                  <button key={m.id_metodo} type="button"
                    onClick={() => setMetodo(String(m.id_metodo))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-semibold
                      ${isSelected
                        ? 'border-primary bg-primary-fixed/20 text-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                      }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-primary' : 'text-stone-400'}`}>
                      {METODO_ICONS[m.nombre] ?? 'payment'}
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
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Fecha de pago
            </label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-stone-50 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
            />
          </div>

          {/* Observaciones */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Observaciones
            </label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
              placeholder="Número de recibo, referencia, etc."
              className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-stone-50 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all
                resize-none placeholder:text-stone-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg
                font-semibold hover:bg-stone-50 transition-all text-sm"
            >
              Cancelar
            </button>
            <button type="submit"
              disabled={opLoading || !metodo || metodos.length === 0}
              className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-semibold
                hover:opacity-90 transition-all shadow-sm disabled:opacity-60
                flex items-center justify-center gap-2 text-sm"
            >
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

export default PagoModal;