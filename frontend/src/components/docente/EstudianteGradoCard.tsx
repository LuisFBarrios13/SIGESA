// src/components/docente/EstudianteGradoCard.tsx

import { useNavigate } from 'react-router-dom';
import type { MatriculaDocente } from '../../services/docenteApi';

interface EstudianteGradoCardProps {
  matricula: MatriculaDocente;
  index:     number;
}

const JORNADA_COLORS: Record<string, string> = {
  MAÑANA: 'bg-amber-100 text-amber-800',
  TARDE:  'bg-indigo-100 text-indigo-800',
};

const JORNADA_LABEL: Record<string, string> = {
  MAÑANA: 'Mañana',
  TARDE:  'Tarde',
};

const EstudianteGradoCard = ({ matricula, index }: EstudianteGradoCardProps) => {
  const { estudiante, grado, jornada } = matricula;
  const navigate = useNavigate();

  const initials = estudiante.nombre
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const age = Math.floor(
    (Date.now() - new Date(estudiante.fecha_nacimiento + 'T00:00:00').getTime()) /
    (1000 * 60 * 60 * 24 * 365.25),
  );

  const handleBoletin = () => {
    const year = matricula.year;
    navigate(`/docente/boletin?matricula=${matricula.id_matricula}&year=${year}`);
  };

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4
      hover:border-primary/40 hover:shadow-md transition-all group">
      <div className="flex items-center gap-4">

        {/* Número */}
        <span className="text-xs font-bold text-stone-300 w-5 text-right flex-shrink-0">
          {String(index).padStart(2, '0')}
        </span>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center
          flex-shrink-0 group-hover:bg-primary transition-colors">
          <span className="text-xs font-black text-on-primary-fixed-variant
            group-hover:text-white transition-colors">
            {initials}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface text-sm truncate">{estudiante.nombre}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-stone-400 font-mono">{estudiante.numero_identidad}</span>
            {estudiante.rh && (
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                {estudiante.rh}
              </span>
            )}
          </div>
        </div>

        {/* Edad + Jornada + Grado */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-stone-400">{age} años</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${JORNADA_COLORS[jornada] ?? 'bg-stone-100 text-stone-600'}`}>
            {JORNADA_LABEL[jornada] ?? jornada}
          </span>
          <span className="text-xs text-stone-500 font-medium">{grado.nombre}</span>
        </div>

        {/* Botón boletín */}
        <button
          onClick={handleBoletin}
          title="Ver boletín"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
            bg-green-50 text-green-800 border border-green-200 rounded-lg
            hover:bg-green-100 transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[14px]">description</span>
          Boletín
        </button>

      </div>
    </div>
  );
};

export default EstudianteGradoCard;