// src/components/acudiente/CuentasLista.tsx
// Single Responsibility: lista de cuentas agrupadas por concepto (Matrícula / Pensión).

import CuentaItem from './CuentaItem';
import type { CuentaCobro } from '../../services/pagosApi';

const CONCEPTO_META: Record<string, { icon: string; bg: string; text: string }> = {
  'MATRÍCULA': { icon: 'how_to_reg', bg: 'bg-blue-50',   text: 'text-blue-700'   },
  'PENSIÓN':   { icon: 'payments',   bg: 'bg-purple-50', text: 'text-purple-700' },
};

const CuentasLista = ({ cuentas }: { cuentas: CuentaCobro[] }) => {
  if (!cuentas.length) {
    return (
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-10
        flex flex-col items-center gap-3 text-stone-400">
        <span className="material-symbols-outlined text-5xl">receipt_long</span>
        <p className="text-sm font-medium">No hay cuentas de cobro generadas</p>
        <p className="text-xs">El administrador las generará cuando corresponda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(['MATRÍCULA', 'PENSIÓN'] as const).map((concepto) => {
        const grupo    = cuentas.filter((c) => c.concepto.nombre === concepto);
        if (!grupo.length) return null;

        const cm       = CONCEPTO_META[concepto];
        const pagadas  = grupo.filter((c) => c.estado === 'PAGADO').length;
        const vencidas = grupo.filter((c) => c.estado === 'VENCIDO').length;

        return (
          <div key={concepto}>
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${cm.bg} mb-2`}>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-base ${cm.text}`}>{cm.icon}</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${cm.text}`}>
                  {concepto}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="text-emerald-700">✓ {pagadas} pagadas</span>
                {vencidas > 0 && <span className="text-red-700">⚠ {vencidas} vencidas</span>}
              </div>
            </div>
            <div className="space-y-2">
              {grupo.map((c) => <CuentaItem key={c.id_cuenta} cuenta={c} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CuentasLista;