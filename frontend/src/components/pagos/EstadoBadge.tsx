// src/components/pagos/EstadoBadge.tsx
import { ESTADO_META } from './pagos.constants';
import type { EstadoCuenta } from '../../services/pagosApi';

interface EstadoBadgeProps {
  estado: EstadoCuenta;
}

const EstadoBadge = ({ estado }: EstadoBadgeProps) => {
  const m = ESTADO_META[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${m.bg} ${m.text} ${m.border}`}>
      <span className="material-symbols-outlined text-[13px]">{m.icon}</span>
      {m.label}
    </span>
  );
};

export default EstadoBadge;