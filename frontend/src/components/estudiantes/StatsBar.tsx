// src/components/estudiantes/StatsBar.tsx
import type { EstudianteListItem } from '../../services/api';
import { getMatriculaActiva } from '../../constants/estudiantes';

const StatsBar = ({ estudiantes }: { estudiantes: EstudianteListItem[] }) => {
  const activos   = estudiantes.filter((e) => getMatriculaActiva(e.matriculas)?.estado === 'ACTIVO').length;
  const retirados = estudiantes.filter((e) => getMatriculaActiva(e.matriculas)?.estado === 'RETIRADO').length;
  const graduados = estudiantes.filter((e) => getMatriculaActiva(e.matriculas)?.estado === 'GRADUADO').length;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'Total',     value: estudiantes.length, icon: 'group',        color: 'text-primary',     bg: 'bg-primary-fixed' },
        { label: 'Activos',   value: activos,            icon: 'check_circle', color: 'text-emerald-700', bg: 'bg-emerald-100'   },
        { label: 'Retirados', value: retirados,          icon: 'cancel',       color: 'text-red-700',     bg: 'bg-red-100'       },
        { label: 'Graduados', value: graduados,          icon: 'school',       color: 'text-blue-700',    bg: 'bg-blue-100'      },
      ].map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
            <span className={`material-symbols-outlined ${s.color} text-xl`}>{s.icon}</span>
          </div>
          <div>
            <p className="text-2xl font-black text-on-surface">{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
