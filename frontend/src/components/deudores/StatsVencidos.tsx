// src/components/deudores/StatsVencidos.tsx
// Single Responsibility: muestra los KPIs de la vista de deudores.

import { fmt } from '../pagos/pagos.constants';
import type { DeudorAgrupado } from '../../types/deudores';

interface StatsVencidosProps {
  deudores:   DeudorAgrupado[];
  totalDeuda: number;
}

const StatsVencidos = ({ deudores, totalDeuda }: StatsVencidosProps) => {
  const totalCuentas = deudores.reduce(
    (s, d) => s + d.cuentas_vencidas.length, 0,
  );
  const conPagosParciales = deudores.filter((d) =>
    d.cuentas_vencidas.some((c) => c.pagos.length > 0),
  ).length;

  const stats = [
    {
      label: 'Estudiantes con deuda',
      value: String(deudores.length),
      icon:  'group',
      bg:    'bg-red-100',
      text:  'text-red-700',
    },
    {
      label: 'Cuentas vencidas',
      value: String(totalCuentas),
      icon:  'receipt_long',
      bg:    'bg-orange-100',
      text:  'text-orange-700',
    },
    {
      label: 'Total vencido',
      value: fmt(totalDeuda),
      icon:  'account_balance_wallet',
      bg:    'bg-red-100',
      text:  'text-red-700',
    },
    {
      label: 'Con pagos parciales',
      value: String(conPagosParciales),
      icon:  'payments',
      bg:    'bg-amber-100',
      text:  'text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-xl border border-outline-variant shadow-sm p-4
            flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
            <span className={`material-symbols-outlined text-xl ${s.text}`}>{s.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black text-on-surface leading-none truncate">{s.value}</p>
            <p className="text-xs text-stone-500 mt-0.5 leading-tight">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsVencidos;