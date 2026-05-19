// src/components/acudiente/MatriculaSelector.tsx
// Single Responsibility: selector de año/matrícula cuando hay más de una.

import type { MatriculaResumenAcudiente } from '../../services/acudienteApi';

const ESTADO_COLOR: Record<string, string> = {
  ACTIVO:   'bg-emerald-100 text-emerald-800',
  RETIRADO: 'bg-red-100 text-red-800',
  GRADUADO: 'bg-blue-100 text-blue-800',
};

interface MatriculaSelectorProps {
  matriculas: MatriculaResumenAcudiente[];
  selected:   MatriculaResumenAcudiente | null;
  onSelect:   (m: MatriculaResumenAcudiente) => void;
}

const MatriculaSelector = ({ matriculas, selected, onSelect }: MatriculaSelectorProps) => {
  if (matriculas.length <= 1) return null;

  const sorted = [...matriculas].sort((a, b) => b.year - a.year);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Año:</p>
      <div className="flex gap-1.5 flex-wrap">
        {sorted.map((m) => {
          const isActive = selected?.id_matricula === m.id_matricula;
          return (
            <button
              key={m.id_matricula}
              onClick={() => onSelect(m)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold
                transition-all
                ${isActive
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/40'
                }`}
            >
              {m.year}
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black
                ${isActive ? 'bg-white/20 text-white' : ESTADO_COLOR[m.estado] ?? 'bg-stone-100 text-stone-600'}`}>
                {m.estado}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MatriculaSelector;