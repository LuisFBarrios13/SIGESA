// src/components/docente/ListaEstudiantesNotas.tsx
// Columna izquierda del registro de notas: buscador, filtro por grado y lista.
import type { DocentePerfil, MatriculaDocente } from '../../services/docenteApi';
import { iniciales } from '../../utils/iniciales';

const JORNADA_COLORS: Record<string, string> = {
  MAÑANA: 'bg-amber-100 text-amber-800',
  TARDE:  'bg-indigo-100 text-indigo-800',
};

interface Props {
  perfil:         DocentePerfil | null;
  estudiantes:    MatriculaDocente[];
  isLoading:      boolean;
  selected:       MatriculaDocente | null;
  onSelect:       (m: MatriculaDocente) => void;
  search:         string;
  onSearch:       (s: string) => void;
  gradoFilter:    number | 'TODOS';
  onGradoFilter:  (g: number | 'TODOS') => void;
}

const ListaEstudiantesNotas = ({
  perfil, estudiantes, isLoading, selected, onSelect,
  search, onSearch, gradoFilter, onGradoFilter,
}: Props) => (
  <div className="w-72 flex-shrink-0 flex flex-col gap-3">

    {/* Buscador */}
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined
        text-stone-400 text-xl pointer-events-none">search</span>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Nombre o ID…"
        className="w-full pl-10 pr-8 py-2.5 text-sm bg-white border border-outline-variant
          rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30
          focus:border-primary transition-all"
      />
      {search && (
        <button
          onClick={() => onSearch('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>

    {/* Filtro por grado — solo si el docente tiene más de un grado */}
    {perfil && perfil.grados.length > 1 && (
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
        <button
          onClick={() => onGradoFilter('TODOS')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all
            ${gradoFilter === 'TODOS'
              ? 'bg-white text-primary shadow-sm'
              : 'text-stone-500 hover:text-on-surface'
            }`}
        >
          Todos
        </button>
        {perfil.grados.map((g) => (
          <button
            key={g.id_grado}
            onClick={() => onGradoFilter(g.id_grado)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all truncate px-1
              ${gradoFilter === g.id_grado
                ? 'bg-white text-primary shadow-sm'
                : 'text-stone-500 hover:text-on-surface'
              }`}
            title={`${g.nombre} — ${g.jornada}`}
          >
            {g.nombre}{' '}
            <span className={`inline-block text-[9px] font-black px-1 rounded
              ${gradoFilter === g.id_grado ? 'bg-primary/10' : 'bg-stone-200'}`}>
              {g.jornada === 'MAÑANA' ? 'M' : 'T'}
            </span>
          </button>
        ))}
      </div>
    )}

    {/* Lista */}
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex-1">
      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/60">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">
          {isLoading
            ? 'Cargando…'
            : `${estudiantes.length} estudiante${estudiantes.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <span className="material-symbols-outlined text-primary animate-spin text-2xl">
            progress_activity
          </span>
        </div>
      ) : estudiantes.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-2 text-stone-400">
          <span className="material-symbols-outlined text-4xl">person_search</span>
          <p className="text-xs">Sin resultados</p>
        </div>
      ) : (
        <ul
          className="divide-y divide-stone-50 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 290px)' }}
        >
          {estudiantes.map((m) => {
            const isSelected = selected?.id_matricula === m.id_matricula;
            return (
              <li key={m.id_matricula}>
                <button
                  onClick={() => onSelect(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left
                    transition-colors group
                    ${isSelected
                      ? 'bg-primary-fixed/20 border-l-4 border-primary'
                      : 'hover:bg-stone-50 border-l-4 border-transparent'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center
                    flex-shrink-0 text-xs font-black transition-colors
                    ${isSelected
                      ? 'bg-primary text-white'
                      : 'bg-primary-fixed text-on-primary-fixed-variant'
                    }`}>
                    {iniciales(m.estudiante.nombre)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate transition-colors
                      ${isSelected ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>
                      {m.estudiante.nombre}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-stone-400 font-mono truncate">
                        {m.estudiante.numero_identidad}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0
                        ${JORNADA_COLORS[m.jornada] ?? 'bg-stone-100 text-stone-600'}`}>
                        {m.jornada === 'MAÑANA' ? 'M' : 'T'}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  </div>
);

export default ListaEstudiantesNotas;
