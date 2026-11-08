// src/components/matricula/JornadaOption.tsx
import type { Jornada } from '../../hooks/useMatriculaForm';

interface JornadaOptionProps {
  value:       Jornada;
  label:       string;
  description: string;
  icon:        string;
  selected:    boolean;
  onSelect:    (v: Jornada) => void;
}

const JornadaOption = ({ value, label, description, icon, selected, onSelect }: JornadaOptionProps) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={`flex-1 flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all
      ${selected
        ? 'border-primary bg-primary-fixed/20 shadow-sm'
        : 'border-outline-variant bg-white hover:border-primary/40 hover:bg-stone-50'
      }`}
  >
    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
      ${selected ? 'bg-primary text-white' : 'bg-stone-100 text-stone-500'}`}>
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </div>
    <div>
      <p className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-on-surface'}`}>{label}</p>
      <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
    </div>
    {selected && (
      <span className="material-symbols-outlined text-primary ml-auto text-xl">check_circle</span>
    )}
  </button>
);

export default JornadaOption;
