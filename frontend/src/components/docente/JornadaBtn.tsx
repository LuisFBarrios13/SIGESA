// src/components/docente/JornadaBtn.tsx
import type { JornadaDocente } from '../../services/api';
import { JORNADA_LABEL } from '../../constants/docentes';

interface JornadaBtnProps {
  value: JornadaDocente; icon: string; desc: string;
  selected: boolean; disabled: boolean; onSelect: (v: JornadaDocente) => void;
}
const JornadaBtn = ({ value, icon, desc, selected, disabled, onSelect }: JornadaBtnProps) => (
  <button type="button" disabled={disabled} onClick={() => !disabled && onSelect(value)}
    className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all
      ${disabled  ? 'opacity-35 cursor-not-allowed border-stone-200 bg-stone-50'
      : selected  ? 'border-primary bg-primary-fixed/20 shadow-sm'
      :             'border-outline-variant bg-white hover:border-primary/40 hover:bg-stone-50'}`}
  >
    <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors
      ${disabled ? 'bg-stone-200 text-stone-400'
      : selected ? 'bg-primary text-white'
      :            'bg-stone-100 text-stone-500'}`}>
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </div>
    <div className="text-center">
      <p className={`font-semibold text-sm ${selected && !disabled ? 'text-primary' : 'text-on-surface'}`}>
        {JORNADA_LABEL[value]}
      </p>
      <p className="text-[11px] text-on-surface-variant">{desc}</p>
    </div>
    {selected && !disabled && (
      <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
    )}
  </button>
);

export default JornadaBtn;
