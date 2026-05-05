// src/pages/EstudiantesPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { estudiantesApi, type MatriculaListItem } from '../services/api';
// ── Constants ─────────────────────────────────────────────────

const NOMBRES_GRADOS = [
  'Pre Jardín', 'Jardín', 'Transición',
  'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto',
] as const;

const ESTADO_COLOR: Record<string, string> = {
  ACTIVO:    'bg-emerald-100 text-emerald-800',
  RETIRADO:  'bg-red-100 text-red-800',
  GRADUADO:  'bg-blue-100 text-blue-800',
};

const ESTADO_ICON: Record<string, string> = {
  ACTIVO:   'check_circle',
  RETIRADO: 'cancel',
  GRADUADO: 'school',
};

const JORNADA_COLOR: Record<string, string> = {
  MAÑANA: 'bg-amber-100 text-amber-800',
  TARDE:  'bg-indigo-100 text-indigo-800',
};

// ── Sub-components ────────────────────────────────────────────

interface BadgeProps { label: string; colorClass: string; icon?: string }
const Badge = ({ label, colorClass, icon }: BadgeProps) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>
    {icon && <span className="material-symbols-outlined text-[12px]">{icon}</span>}
    {label}
  </span>
);

interface FilterSelectProps {
  icon: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}
const FilterSelect = ({ icon, value, onChange, options, placeholder }: FilterSelectProps) => (
  <div className="relative flex-1 min-w-[160px]">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-[18px] pointer-events-none">
      {icon}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-outline-variant rounded-lg
        text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30
        focus:border-primary transition-colors"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-[16px] pointer-events-none">
      expand_more
    </span>
  </div>
);

// ── Student Card ──────────────────────────────────────────────

interface StudentCardProps { matricula: MatriculaListItem }
const StudentCard = ({ matricula: m }: StudentCardProps) => {
  const initials = m.estudiante.nombre
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5
      hover:shadow-md hover:border-primary/30 transition-all group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center
          flex-shrink-0 group-hover:bg-primary transition-colors">
          <span className="text-sm font-black text-on-primary-fixed-variant group-hover:text-white transition-colors">
            {initials}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-on-surface text-sm truncate">{m.estudiante.nombre}</p>
              <p className="text-xs text-stone-500 mt-0.5 font-mono">
                ID: {m.estudiante.numero_identidad}
              </p>
            </div>
            <Badge
              label={m.estado}
              colorClass={ESTADO_COLOR[m.estado] ?? 'bg-stone-100 text-stone-700'}
              icon={ESTADO_ICON[m.estado]}
            />
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700
              px-2.5 py-1 rounded-full font-medium">
              <span className="material-symbols-outlined text-[13px] text-secondary">school</span>
              {m.grado?.nombre ?? '—'}
            </span>
            {m.grado?.jornada && (
              <Badge
                label={m.grado.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}
                colorClass={JORNADA_COLOR[m.grado.jornada] ?? ''}
              />
            )}
            <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700
              px-2.5 py-1 rounded-full font-medium">
              <span className="material-symbols-outlined text-[13px] text-stone-400">calendar_today</span>
              {m.year}
            </span>
          </div>

          {/* Extra info */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-stone-100">
            <p className="flex items-center gap-1 text-xs text-stone-400">
              <span className="material-symbols-outlined text-[13px]">event</span>
              Matrícula: {new Date(m.fecha_matricula).toLocaleDateString('es-CO', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
            {m.estudiante.fecha_nacimiento && (
              <p className="flex items-center gap-1 text-xs text-stone-400">
                <span className="material-symbols-outlined text-[13px]">cake</span>
                {new Date(m.estudiante.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Student Table Row ─────────────────────────────────────────

interface StudentRowProps { matricula: MatriculaListItem }
const StudentRow = ({ matricula: m }: StudentRowProps) => (
  <tr className="hover:bg-stone-50/70 transition-colors">
    {/* Estudiante */}
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-black text-on-primary-fixed-variant">
            {m.estudiante.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-on-surface text-sm">{m.estudiante.nombre}</p>
          <p className="text-xs text-stone-400 font-mono">{m.estudiante.numero_identidad}</p>
        </div>
      </div>
    </td>
    {/* Grado */}
    <td className="px-5 py-3.5 text-sm text-stone-600">
      {m.grado?.nombre ?? '—'}
    </td>
    {/* Jornada */}
    <td className="px-5 py-3.5">
      {m.grado?.jornada ? (
        <Badge
          label={m.grado.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}
          colorClass={JORNADA_COLOR[m.grado.jornada] ?? ''}
        />
      ) : <span className="text-stone-300 text-xs">—</span>}
    </td>
    {/* Año */}
    <td className="px-5 py-3.5 text-sm text-stone-600 font-mono">{m.year}</td>
    {/* Nacimiento */}
    <td className="px-5 py-3.5 text-xs text-stone-500">
      {m.estudiante.fecha_nacimiento
        ? new Date(m.estudiante.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : '—'}
    </td>
    {/* Estado */}
    <td className="px-5 py-3.5">
      <Badge
        label={m.estado}
        colorClass={ESTADO_COLOR[m.estado] ?? 'bg-stone-100 text-stone-700'}
        icon={ESTADO_ICON[m.estado]}
      />
    </td>
    {/* Fecha matrícula */}
    <td className="px-5 py-3.5 text-xs text-stone-500">
      {new Date(m.fecha_matricula).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
      })}
    </td>
  </tr>
);

// ── Stats bar ─────────────────────────────────────────────────

interface StatsBarProps { matriculas: MatriculaListItem[]; filtered: MatriculaListItem[] }
const StatsBar = ({ matriculas, filtered }: StatsBarProps) => {
  const activos   = matriculas.filter((m) => m.estado === 'ACTIVO').length;
  const retirados = matriculas.filter((m) => m.estado === 'RETIRADO').length;
  const graduados = matriculas.filter((m) => m.estado === 'GRADUADO').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'Total matrículas', value: matriculas.length, icon: 'format_list_numbered', color: 'text-primary', bg: 'bg-primary-fixed' },
        { label: 'Activos',          value: activos,           icon: 'check_circle',          color: 'text-emerald-700', bg: 'bg-emerald-100' },
        { label: 'Retirados',        value: retirados,         icon: 'cancel',                color: 'text-red-700',     bg: 'bg-red-100'     },
        { label: 'Graduados',        value: graduados,         icon: 'school',                color: 'text-blue-700',    bg: 'bg-blue-100'    },
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

// ── Main Page ─────────────────────────────────────────────────

type ViewMode = 'cards' | 'table';

const EstudiantesPage = () => {
  const [matriculas, setMatriculas]   = useState<MatriculaListItem[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [viewMode, setViewMode]       = useState<ViewMode>('table');

  // Filters
  const [search, setSearch]           = useState('');
  const [filterGrado, setFilterGrado] = useState('');
  const [filterYear, setFilterYear]   = useState('');
  const [filterJornada, setFilterJornada] = useState('');
  const [filterEstado, setFilterEstado]   = useState('');

  const fetchMatriculas = () => {
    setIsLoading(true);
    setError('');
    estudiantesApi.listarMatriculas()
      .then(setMatriculas)
      .catch(() => setError('No se pudo cargar la lista de estudiantes.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchMatriculas(); }, []);

  // Compute available years from data
  const years = useMemo(() => {
    const set = new Set(matriculas.map((m) => String(m.year)));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [matriculas]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return matriculas.filter((m) => {
      if (q && !m.estudiante.nombre.toLowerCase().includes(q) &&
          !m.estudiante.numero_identidad.toLowerCase().includes(q)) return false;
      if (filterGrado   && m.grado?.nombre   !== filterGrado)   return false;
      if (filterYear    && String(m.year)     !== filterYear)    return false;
      if (filterJornada && m.grado?.jornada   !== filterJornada) return false;
      if (filterEstado  && m.estado           !== filterEstado)  return false;
      return true;
    });
  }, [matriculas, search, filterGrado, filterYear, filterJornada, filterEstado]);

  const hasFilters = !!(search || filterGrado || filterYear || filterJornada || filterEstado);

  const clearFilters = () => {
    setSearch('');
    setFilterGrado('');
    setFilterYear('');
    setFilterJornada('');
    setFilterEstado('');
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Estudiantes</h1>
          <p className="text-base text-stone-500 mt-1">
            Consulta y filtra todos los estudiantes matriculados en el sistema.
          </p>
        </div>
        <button
          onClick={fetchMatriculas}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-outline-variant
            text-on-surface-variant rounded-lg font-semibold hover:bg-stone-50 transition-all text-sm"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Actualizar
        </button>
      </div>

      {/* Stats */}
      {!isLoading && !error && <StatsBar matriculas={matriculas} filtered={filtered} />}

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-xl">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o número de identidad…"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200
              rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30
              focus:border-primary focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3 items-center">
          <FilterSelect
            icon="school"
            value={filterGrado}
            onChange={setFilterGrado}
            placeholder="Todos los grados"
            options={NOMBRES_GRADOS.map((g) => ({ value: g, label: g }))}
          />
          <FilterSelect
            icon="wb_sunny"
            value={filterJornada}
            onChange={setFilterJornada}
            placeholder="Todas las jornadas"
            options={[
              { value: 'MAÑANA', label: 'Mañana' },
              { value: 'TARDE',  label: 'Tarde'  },
            ]}
          />
          <FilterSelect
            icon="calendar_today"
            value={filterYear}
            onChange={setFilterYear}
            placeholder="Todos los años"
            options={years.map((y) => ({ value: y, label: y }))}
          />
          <FilterSelect
            icon="flag"
            value={filterEstado}
            onChange={setFilterEstado}
            placeholder="Todos los estados"
            options={[
              { value: 'ACTIVO',   label: 'Activo'   },
              { value: 'RETIRADO', label: 'Retirado' },
              { value: 'GRADUADO', label: 'Graduado' },
            ]}
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold
                text-error border border-error/30 bg-error-container/30 rounded-lg
                hover:bg-error-container/60 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">filter_list_off</span>
              Limpiar filtros
            </button>
          )}

          {/* Spacer + view toggle */}
          <div className="ml-auto flex items-center gap-1 bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              title="Vista tabla"
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'table'
                ? 'bg-white shadow-sm text-primary'
                : 'text-stone-400 hover:text-stone-600'}`}
            >
              <span className="material-symbols-outlined text-xl">table_rows</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Vista tarjetas"
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards'
                ? 'bg-white shadow-sm text-primary'
                : 'text-stone-400 hover:text-stone-600'}`}
            >
              <span className="material-symbols-outlined text-xl">grid_view</span>
            </button>
          </div>
        </div>

        {/* Result count */}
        {!isLoading && (
          <p className="text-xs text-stone-400">
            {hasFilters
              ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} de ${matriculas.length} matrículas`
              : `${matriculas.length} matrícula${matriculas.length !== 1 ? 's' : ''} en total`
            }
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border border-error/20">
          <span className="material-symbols-outlined text-error text-xl">error</span>
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-primary animate-spin text-5xl">
              progress_activity
            </span>
            <p className="text-sm text-stone-400">Cargando estudiantes…</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-outline-variant shadow-sm
          py-20 flex flex-col items-center gap-4 text-stone-400">
          <span className="material-symbols-outlined text-6xl">
            {hasFilters ? 'manage_search' : 'group_off'}
          </span>
          <div className="text-center">
            <p className="font-semibold text-sm">
              {hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay estudiantes registrados'}
            </p>
            <p className="text-xs mt-1">
              {hasFilters ? 'Prueba con otros filtros o limpia la búsqueda.' : 'Las matrículas aparecerán aquí una vez creadas.'}
            </p>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-xs font-semibold text-primary border border-primary/30
                rounded-lg hover:bg-primary-fixed/20 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && filtered.length > 0 && (
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <StudentCard key={m.id_matricula} matricula={m} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/60 flex items-center gap-3">
              <div className="p-2 bg-primary-fixed rounded-lg">
                <span className="material-symbols-outlined text-on-primary-fixed-variant text-xl">group</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">Lista de estudiantes</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {filtered.length} matrícula{filtered.length !== 1 ? 's' : ''}
                  {hasFilters && ' (filtrado)'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    {['Estudiante', 'Grado', 'Jornada', 'Año', 'Nacimiento', 'Estado', 'Fecha matrícula'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[11px] font-bold text-stone-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filtered.map((m) => (
                    <StudentRow key={m.id_matricula} matricula={m} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </>
  );
};

export default EstudiantesPage;