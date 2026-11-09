// src/components/estudiantes/FilterSelect.tsx
// Filtro con ícono sobre fondo crema (dentro de una tarjeta blanca).
import { Icono } from '../ds/Controles';

interface FilterSelectProps {
  icon: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder: string;
}

const FilterSelect = ({ icon, value, onChange, options, placeholder }: FilterSelectProps) => (
  <label className="flex items-center gap-2 min-h-12 pl-3.5 pr-2 rounded-[14px] bg-crema text-tinta-media flex-1 min-w-[170px]">
    <Icono nombre={icon} className="text-[19px] text-tinta-suave" />
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder}
      className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-tinta cursor-pointer focus:outline-none">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
);

export default FilterSelect;
