// src/components/docente/DocenteCard.tsx
import type { DocenteListItem } from '../../services/api';
import JornadaBadge from './JornadaBadge';

interface DocenteCardProps {
  docente:   DocenteListItem;
  onEditar:  (d: DocenteListItem) => void;
  onRestablecerClave: (d: DocenteListItem) => void;
}

const DocenteCard = ({ docente, onEditar, onRestablecerClave }: DocenteCardProps) => (
  <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5
    flex flex-col gap-3 hover:border-primary/30 hover:shadow-md transition-all">

    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-on-primary-fixed-variant text-2xl">person</span>
        </div>
        <div>
          <p className="font-bold text-on-surface text-sm">{docente.nombre}</p>
          <p className="text-xs text-stone-500">CC {docente.cedula}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <JornadaBadge jornada={docente.jornada} />
        <button
          onClick={() => onRestablecerClave(docente)}
          title="Restablecer contraseña"
          aria-label={`Restablecer la contraseña de ${docente.nombre}`}
          className="p-1.5 rounded-lg text-stone-400 hover:text-primary hover:bg-primary-fixed/30 transition-all"
        >
          <span className="material-symbols-outlined text-lg">key</span>
        </button>
        <button
          onClick={() => onEditar(docente)}
          title="Editar docente"
          aria-label={`Editar a ${docente.nombre}`}
          className="p-1.5 rounded-lg text-stone-400 hover:text-primary hover:bg-primary-fixed/30 transition-all"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
        </button>
      </div>
    </div>

    {docente.grados.length > 0 && (
      <div className="flex flex-wrap gap-2 pt-1 border-t border-stone-100">
        {docente.grados.map((g) => (
          <span key={g.id_grado}
            className="flex items-center gap-1 text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full font-medium">
            <span className="material-symbols-outlined text-[14px] text-secondary">school</span>
            {g.nombre} – {g.jornada === 'MAÑANA' ? 'M' : 'T'}
          </span>
        ))}
      </div>
    )}

    <div className="text-xs text-stone-400 flex gap-4 pt-1 border-t border-stone-100 flex-wrap">
      {docente.telefono && <span>📞 {docente.telefono}</span>}
      {docente.correo   && <span className="truncate">✉ {docente.correo}</span>}
    </div>
  </div>
);

export default DocenteCard;
