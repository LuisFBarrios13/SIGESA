// src/components/pagos/SearchSection.tsx
// Buscar la matrícula de un estudiante por nombre o documento.
import type { MatriculaResumen } from '../../services/pagosApi';
import Tarjeta from '../ds/Tarjeta';
import { Avatar, Icono } from '../ds/Controles';

interface SearchSectionProps {
  query:       string;
  setQuery:    (v: string) => void;
  results:     MatriculaResumen[];
  isSearching: boolean;
  onSelect:    (m: MatriculaResumen) => void;
}

const SearchSection = ({ query, setQuery, results, isSearching, onSelect }: SearchSectionProps) => (
  <Tarjeta titulo="Buscar estudiante" subtitulo="Por nombre o número de identidad">
    <label className="flex items-center gap-2.5 min-h-[52px] px-4 rounded-2xl bg-crema text-tinta-suave">
      <Icono nombre="search" className="text-xl" />
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar estudiante"
        placeholder="Escribe el nombre o el documento del estudiante"
        className="flex-1 min-w-0 bg-transparent text-base text-tinta placeholder:text-tinta-suave focus:outline-none" />
      {isSearching && <Icono nombre="progress_activity" className="animate-spin text-vino text-xl" />}
    </label>

    {results.length > 0 && (
      <ul className="flex flex-col gap-2">
        {results.map((m) => (
          <li key={m.id_matricula}>
            <button type="button" onClick={() => onSelect(m)}
              className="w-full flex items-center gap-3 rounded-2xl bg-crema px-3.5 py-3 text-left hover:bg-vino-suave transition-colors group">
              <Avatar nombre={m.estudiante.nombre} tamano={44} />
              <span className="flex-1 min-w-0 flex flex-col">
                <span className="text-[15px] font-semibold text-tinta break-words">{m.estudiante.nombre}</span>
                <span className="text-[13px] text-tinta-media">
                  Doc. {m.estudiante.numero_identidad} · {m.grado.nombre} · {m.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'} · {m.year}
                </span>
              </span>
              <Icono nombre="chevron_right" className="text-tinta-suave group-hover:text-vino" />
            </button>
          </li>
        ))}
      </ul>
    )}

    {!isSearching && query.trim().length >= 2 && results.length === 0 && (
      <p className="text-sm text-tinta-suave text-center py-2">Ningún estudiante coincide con «{query.trim()}».</p>
    )}
    {query.trim().length < 2 && (
      <p className="text-sm text-tinta-suave text-center py-2">Escribe al menos 2 caracteres para buscar.</p>
    )}
  </Tarjeta>
);

export default SearchSection;
