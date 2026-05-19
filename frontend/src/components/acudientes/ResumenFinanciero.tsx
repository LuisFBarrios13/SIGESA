// src/components/acudiente/ResumenFinanciero.tsx
// Single Responsibility: totales de deuda/pagado/pendiente con barra de progreso.

const fmt = (n: number | string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(Number(n));

interface ResumenFinancieroProps {
  totales: { deuda: number; pagado: number; pendiente: number };
  tarifa:  { valor_pension: string; valor_matricula: string } | null;
  year:    number;
}

const ResumenFinanciero = ({ totales, tarifa, year }: ResumenFinancieroProps) => {
  const pct = totales.deuda > 0
    ? Math.round((totales.pagado / totales.deuda) * 100)
    : 0;

  const stats = [
    { label: 'Total deuda',     value: totales.deuda,     icon: 'receipt_long',         bg: 'bg-blue-50 border-blue-100',     text: 'text-blue-700' },
    { label: 'Total pagado',    value: totales.pagado,    icon: 'check_circle',          bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
    { label: 'Saldo pendiente', value: totales.pendiente, icon: 'account_balance_wallet',
      bg:   totales.pendiente > 0 ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100',
      text: totales.pendiente > 0 ? 'text-orange-700' : 'text-emerald-700' },
  ];

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-fixed rounded-lg">
          <span className="material-symbols-outlined text-on-primary-fixed-variant text-xl">
            account_balance
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-on-surface">Estado de cuenta {year}</h3>
          {tarifa && (
            <p className="text-xs text-stone-400 mt-0.5">
              Pensión: {fmt(tarifa.valor_pension)}/mes · Matrícula: {fmt(tarifa.valor_matricula)}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-stone-400">Pagado</p>
          <p className="text-xl font-black text-on-surface">{pct}%</p>
        </div>
      </div>

      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-secondary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon, bg, text }) => (
          <div key={label} className={`rounded-xl border p-3 flex flex-col gap-1 ${bg}`}>
            <div className="flex items-center gap-1.5">
              <span className={`material-symbols-outlined text-base ${text}`}>{icon}</span>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${text}`}>{label}</p>
            </div>
            <p className={`text-base font-black ${text}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumenFinanciero;