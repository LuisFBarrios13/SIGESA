// src/components/estudiantes/StudentRow.tsx
import type { EstudianteListItem } from '../../services/api';
import { ESTADO_COLOR, ESTADO_ICON, JORNADA_COLOR, getMatriculaActiva } from '../../constants/estudiantes';
import PillBadge from './PillBadge';
import { iniciales } from '../../utils/iniciales';

interface StudentRowProps {
  estudiante:         EstudianteListItem;
  onEditarEstudiante: (e: EstudianteListItem) => void;
  onVerAcudientes:    (id: string, nombre: string) => void;
  panelAbierto:       boolean;
}

const StudentRow = ({ estudiante: e, onEditarEstudiante, onVerAcudientes, panelAbierto }: StudentRowProps) => {
  const matricula = getMatriculaActiva(e.matriculas);
  return (
    <tr className={`transition-colors group ${panelAbierto ? 'bg-primary-fixed/10' : 'hover:bg-stone-50/70'}`}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-on-primary-fixed-variant">
              {iniciales(e.nombre)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-on-surface text-sm">{e.nombre}</p>
            <p className="text-xs text-stone-400 font-mono">{e.numero_identidad}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-stone-600">{matricula?.grado?.nombre ?? '—'}</td>
      <td className="px-5 py-3.5">
        {matricula?.grado?.jornada
          ? <PillBadge label={matricula.grado.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}
              colorClass={JORNADA_COLOR[matricula.grado.jornada] ?? ''} />
          : <span className="text-stone-300 text-xs">—</span>}
      </td>
      <td className="px-5 py-3.5 text-sm text-stone-600 font-mono">{matricula?.year ?? '—'}</td>
      <td className="px-5 py-3.5 text-xs text-stone-500">
        {e.fecha_nacimiento
          ? new Date(e.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-CO', {
              day: '2-digit', month: 'short', year: 'numeric' })
          : '—'}
      </td>
      <td className="px-5 py-3.5">
        {matricula
          ? <PillBadge label={matricula.estado}
              colorClass={ESTADO_COLOR[matricula.estado] ?? 'bg-stone-100 text-stone-700'}
              icon={ESTADO_ICON[matricula.estado]} />
          : <span className="text-stone-300 text-xs">—</span>}
      </td>
      <td className="px-5 py-3.5 text-xs text-stone-500">
        {matricula
          ? new Date(matricula.fecha_matricula).toLocaleDateString('es-CO', {
              day: '2-digit', month: 'short', year: 'numeric' })
          : '—'}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEditarEstudiante(e)} title="Editar estudiante"
            className="p-1.5 rounded-lg text-stone-400 hover:text-primary hover:bg-primary-fixed/30 transition-all">
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button onClick={() => onVerAcudientes(e.numero_identidad, e.nombre)}
            title="Ver / editar acudientes"
            className={`p-1.5 rounded-lg transition-all
              ${panelAbierto
                ? 'text-secondary bg-secondary-container/30'
                : 'text-stone-400 hover:text-secondary hover:bg-secondary-container/20'}`}>
            <span className="material-symbols-outlined text-lg">family_restroom</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StudentRow;
