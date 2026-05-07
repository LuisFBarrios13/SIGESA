// src/components/pagos/TotalsBar.tsx
import MoneyText from './MoneyText';
import type { ResumenPagos } from '../../services/pagosApi';

interface TotalsBarProps {
  totales: ResumenPagos['totales'];
}

const TotalsBar = ({ totales }: TotalsBarProps) => (
  <div className="grid grid-cols-3 gap-4">
    {[
      {
        label: 'Total deuda',
        value: totales.deuda,
        icon:  'receipt_long',
        bg:    'bg-blue-50 border-blue-200',
        text:  'text-blue-700',
      },
      {
        label: 'Total pagado',
        value: totales.pagado,
        icon:  'check_circle',
        bg:    'bg-emerald-50 border-emerald-200',
        text:  'text-emerald-700',
      },
      {
        label: 'Saldo pendiente',
        value: totales.pendiente,
        icon:  'account_balance_wallet',
        bg:    totales.pendiente > 0
          ? 'bg-orange-50 border-orange-200'
          : 'bg-emerald-50 border-emerald-200',
        text:  totales.pendiente > 0 ? 'text-orange-700' : 'text-emerald-700',
      },
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

export default TotalsBar;