// src/components/docente/JornadaBtn.tsx
// Opción de jornada laboral del docente.
import type { JornadaDocente } from '../../services/api';
import { JORNADA_LABEL } from '../../constants/docentes';
import { Icono } from '../ds/Controles';

interface JornadaBtnProps {
  value: JornadaDocente; icon: string; desc: string;
  selected: boolean; disabled: boolean; onSelect: (v: JornadaDocente) => void;
}

const JornadaBtn = ({ value, icon, desc, selected, disabled, onSelect }: JornadaBtnProps) => (
  <button type="button" disabled={disabled} onClick={() => !disabled && onSelect(value)} aria-pressed={selected}
    className={`flex flex-col items-center gap-1 px-3 py-3.5 rounded-2xl border-2 text-center transition-colors
      ${disabled ? 'opacity-40 cursor-not-allowed border-linea bg-crema'
      : selected ? 'bg-vino-suave border-vino/30'
      :            'bg-tarjeta border-linea hover:border-vino/20'}`}>
    <Icono nombre={selected ? 'check_circle' : icon} className="text-vino text-[22px]" />
    <span className="text-sm font-semibold text-tinta">{JORNADA_LABEL[value]}</span>
    <span className="text-xs text-tinta-suave">{desc}</span>
  </button>
);

export default JornadaBtn;
