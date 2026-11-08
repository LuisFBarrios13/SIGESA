// src/components/estudiantes/FilterSelect.tsx

interface FilterSelectProps {
  icon: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder: string;
}
const FilterSelect = ({ icon, value, onChange, options, placeholder }: FilterSelectProps) => (
  <div className="relative flex-1 min-w-[160px]">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined
      text-stone-400 text-[18px] pointer-events-none">{icon}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-outline-variant rounded-lg
        text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30
        focus:border-primary transition-colors">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined
      text-stone-400 text-[16px] pointer-events-none">expand_more</span>
  </div>
);

export default FilterSelect;
