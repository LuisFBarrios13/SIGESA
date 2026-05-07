// src/components/pagos/SearchSection.tsx
import type { MatriculaResumen } from '../../services/pagosApi';

interface SearchSectionProps {
  query:      string;
  setQuery:   (v: string) => void;
  results:    MatriculaResumen[];
  isSearching: boolean;
  onSelect:   (m: MatriculaResumen) => void;
}

const SearchSection = ({
  query, setQuery, results, isSearching, onSelect,
}: SearchSectionProps) => (
  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
      <div className="p-2 bg-stone-100 rounded-lg">
        <span className="material-symbols-outlined text-xl text-on-surface-variant">manage_search</span>
      </div>
      <div>
        <h3 className="font-semibold text-on-surface">Buscar estudiante</h3>
        <p className="text-xs text-stone-500">Busca por nombre o número de identidad</p>
      </div>
    </div>

    <div className="p-6 space-y-4">
      {/* Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
          <span className="material-symbols-outlined text-xl">search</span>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe nombre o cédula del estudiante…"
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-outline-variant bg-stone-50 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            focus:bg-white transition-all"
        />
        {isSearching && (
          <span className="absolute inset-y-0 right-3 flex items-center">
            <span className="material-symbols-outlined text-primary animate-spin text-xl">
              progress_activity
            </span>
          </span>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-lg border border-outline-variant overflow-hidden">
          {results.map((m) => (
            <li key={m.id_matricula}>
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left
                  hover:bg-stone-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center
                  flex-shrink-0 text-xs font-black text-on-primary-fixed-variant">
                  {m.estudiante.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                    {m.estudiante.nombre}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    CC {m.estudiante.numero_identidad} · {m.grado.nombre} · {m.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'} · {m.year}
                  </p>
                </div>
                <span className="material-symbols-outlined text-stone-300 group-hover:text-primary transition-colors">
                  arrow_forward
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Empty */}
      {query.length >= 2 && !isSearching && results.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-stone-400">
          <span className="material-symbols-outlined text-4xl">person_search</span>
          <p className="text-sm">No se encontraron estudiantes con matrícula activa</p>
        </div>
      )}

      {!query && (
        <p className="text-center text-xs text-stone-400 py-2">
          Escribe al menos 2 caracteres para buscar
        </p>
      )}
    </div>
  </div>
);

export default SearchSection;