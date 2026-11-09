// src/components/estudiantes/StudentCard.tsx
import type { EstudianteListItem } from '../../services/api';
import type { MatriculaListItem } from '../../types/matriculas';
import { ESTADO_COLOR, ESTADO_ICON, JORNADA_COLOR, getMatriculaActiva, getMatriculaVigente } from '../../constants/estudiantes';
import PillBadge from './PillBadge';
import { iniciales } from '../../utils/iniciales';

interface StudentCardProps {
  estudiante:         EstudianteListItem;
  onEditarEstudiante: (e: EstudianteListItem) => void;
  onVerAcudientes:    (id: string, nombre: string) => void;
  onMatricular:       (e: EstudianteListItem) => void;
  onCambiarEstado:    (e: EstudianteListItem, m: MatriculaListItem) => void;
  panelAbierto:       boolean;
}

const StudentCard = ({
  estudiante: e, onEditarEstudiante, onVerAcudientes, onMatricular, onCambiarEstado, panelAbierto,
}: StudentCardProps) => {
  const matricula = getMatriculaActiva(e.matriculas);
  const vigente   = getMatriculaVigente(e.matriculas);
  const initials  = iniciales(e.nombre);

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition-all group
      ${panelAbierto ? 'border-primary/40 shadow-md' : 'border-outline-variant hover:shadow-md hover:border-primary/30'}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center
          flex-shrink-0 group-hover:bg-primary transition-colors">
          <span className="text-sm font-black text-on-primary-fixed-variant group-hover:text-white transition-colors">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-on-surface text-sm truncate">{e.nombre}</p>
              <p className="text-xs text-stone-500 mt-0.5 font-mono">ID: {e.numero_identidad}</p>
            </div>
            {matricula && (
              <PillBadge label={matricula.estado}
                colorClass={ESTADO_COLOR[matricula.estado] ?? 'bg-stone-100 text-stone-700'}
                icon={ESTADO_ICON[matricula.estado]} />
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {matricula?.grado && (
              <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700
                px-2.5 py-1 rounded-full font-medium">
                <span className="material-symbols-outlined text-[13px] text-secondary">school</span>
                {matricula.grado.nombre}
              </span>
            )}
            {matricula?.grado?.jornada && (
              <PillBadge label={matricula.grado.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}
                colorClass={JORNADA_COLOR[matricula.grado.jornada] ?? ''} />
            )}
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t border-stone-100 flex-wrap">
            <button onClick={() => onEditarEstudiante(e)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                bg-stone-100 text-stone-700 rounded-lg hover:bg-primary-fixed/30 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[15px]">edit</span>
              Estudiante
            </button>
            <button onClick={() => onVerAcudientes(e.numero_identidad, e.nombre)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                rounded-lg transition-colors
                ${panelAbierto
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-stone-100 text-stone-700 hover:bg-secondary-container/30 hover:text-secondary'
                }`}>
              <span className="material-symbols-outlined text-[15px]">family_restroom</span>
              Acudientes
            </button>
            <button onClick={() => onMatricular(e)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                bg-stone-100 text-stone-700 rounded-lg hover:bg-primary-fixed/30 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
              Matricular
            </button>
            {vigente && vigente.estado !== 'GRADUADO' && (
              <button onClick={() => onCambiarEstado(e, vigente)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
                  ${vigente.estado === 'ACTIVO'
                    ? 'bg-stone-100 text-stone-700 hover:bg-red-50 hover:text-red-700'
                    : 'bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <span className="material-symbols-outlined text-[15px]">
                  {vigente.estado === 'ACTIVO' ? 'person_remove' : 'person_check'}
                </span>
                {vigente.estado === 'ACTIVO' ? 'Retirar' : 'Reactivar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;
