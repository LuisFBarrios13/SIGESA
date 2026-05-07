// src/components/pagos/MoneyText.tsx
import { fmt } from './pagos.constants';

interface MoneyTextProps {
  value: number | string;
  className?: string;
}

const MoneyText = ({ value, className = '' }: MoneyTextProps) => (
  <span className={`font-bold tabular-nums ${className}`}>{fmt(value)}</span>
);

export default MoneyText;