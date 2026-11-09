// src/components/matricula/JornadaOption.tsx
// Opción de jornada (mañana / tarde) con sus horarios.
import type { Jornada } from '../../hooks/useMatriculaForm';
import { Icono } from '../ds/Controles';

interface JornadaOptionProps {
  value:       Jornada;
  label:       string;
  /** Una línea por horario. */
  horarios:    string[];
  icon:        string;
  selected:    boolean;
  onSelect:    (v: Jornada) => void;
}

const JornadaOption = ({ value, label, horarios, icon, selected, onSelect }: JornadaOptionProps) => (
  <button type="button" onClick={() => onSelect(value)} aria-pressed={selected}
    className={`flex-1 flex items-center gap-3.5 p-4 rounded-[18px] text-left transition-colors border-2
      ${selected ? 'bg-vino-suave border-vino/30' : 'bg-tarjeta border-linea hover:border-vino/20'}`}>
    <span aria-hidden="true" className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0
      ${value === 'MAÑANA' ? 'bg-dorado-suave text-dorado-texto' : 'bg-azul-suave text-azul-texto'}`}>
      <Icono nombre={icon} className="text-xl" />
    </span>
    <span className="flex flex-col flex-1 min-w-0">
      <span className="text-[15px] font-semibold text-tinta">{label}</span>
      {horarios.map((h) => <span key={h} className="text-xs text-tinta-suave">{h}</span>)}
    </span>
    {selected && <Icono nombre="check_circle" className="text-vino text-xl shrink-0" />}
  </button>
);

export default JornadaOption;
