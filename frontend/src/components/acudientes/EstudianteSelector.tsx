// src/components/acudiente/EstudianteSelector.tsx
// Single Responsibility: tabs para cambiar de estudiante cuando hay más de uno.

import type { EstudianteVinculado } from '../../services/acudienteApi';

interface EstudianteSelectorProps {
  estudiantes: EstudianteVinculado[];
  selected:    EstudianteVinculado | null;
  onSelect:    (e: EstudianteVinculado) => void;
}

const EstudianteTab = ({
  estudiante, isActive, onClick,
}: {
  estudiante: EstudianteVinculado;
  isActive:   boolean;
  onClick:    () => void;
}) => {
  const initials = estudiante.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const active   = estudiante.matriculas.find((m) => m.estado === 'ACTIVO') ?? estudiante.matriculas[0];

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left
        ${isActive
          ? 'border-primary bg-primary-fixed/20 shadow-sm'
          : 'border-outline-variant bg-white hover:border-primary/30 hover:bg-stone-50'
        }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
        text-xs font-black transition-colors
        ${isActive ? 'bg-orange-900 text-white' : 'bg-primary-fixed text-on-primary-fixed-variant'}`}>
        {initials}
      </div>
      <div className="min-w-0">
        <p className={`font-bold text-sm truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>
          {estudiante.nombre}
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">
          {active
            ? `${active.grado.nombre} · ${active.year}`
            : `ID ${estudiante.numero_identidad}`}
        </p>
      </div>
      {isActive && (
        <span className="material-symbols-outlined text-primary text-lg ml-auto">check_circle</span>
      )}
    </button>
  );
};

// No se renderiza si solo hay un estudiante (oculto por diseño)
const EstudianteSelector = ({ estudiantes, selected, onSelect }: EstudianteSelectorProps) => {
  if (estudiantes.length <= 1) return null;

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4">
      <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-base">people</span>
        Mis estudiantes
      </p>
      <div className="flex gap-3 flex-wrap">
        {estudiantes.map((e) => (
          <EstudianteTab
            key={e.numero_identidad}
            estudiante={e}
            isActive={selected?.numero_identidad === e.numero_identidad}
            onClick={() => onSelect(e)}
          />
        ))}
      </div>
    </div>
  );
};

export default EstudianteSelector;