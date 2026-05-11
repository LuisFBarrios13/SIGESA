// src/pages/docente/MiGradoPage.tsx
import { useMiGrado } from '../../hooks/useMiGrado';
import EstudianteGradoCard from '../../components/docente/EstudianteGradoCard';

const JORNADA_LABEL: Record<string, string> = {
  MAÑANA:   '☀️ Mañana',
  TARDE:    '🌙 Tarde',
  COMPLETA: '☀️🌙 Completa',
};

const yearOptions = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 1 + i);

const MiGradoPage = () => {
  const {
    perfil, isLoading, error,
    year, setYear,
    search, setSearch,
    gradoFilter, setGradoFilter,
    filtered, refresh,
  } = useMiGrado();

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Mi Grado</h1>
          <p className="text-base text-stone-500 mt-1">
            Lista de estudiantes matriculados en tu grado para el año seleccionado
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2.5 rounded-lg border border-outline-variant bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium cursor-pointer"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={refresh}
            className="p-2.5 border border-outline-variant rounded-lg text-stone-400
              hover:text-primary hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">refresh</span>
          </button>
        </div>
      </div>

      {/* Perfil card */}
      {perfil && !isLoading && (
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5 flex items-center gap-5 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-orange-900 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-2xl">person_book</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-on-surface text-lg">{perfil.nombre}</p>
            <p className="text-sm text-stone-500">
              Jornada {JORNADA_LABEL[perfil.jornada] ?? perfil.jornada}
              {perfil.correo && <> · {perfil.correo}</>}
            </p>
          </div>
          {/* Grados asignados */}
          <div className="flex gap-2 flex-wrap">
            {perfil.grados.map((g) => (
              <span
                key={g.id_grado}
                className="flex items-center gap-1.5 text-xs bg-primary-fixed text-on-primary-fixed-variant
                  px-3 py-1.5 rounded-full font-semibold"
              >
                <span className="material-symbols-outlined text-[14px]">school</span>
                {g.nombre} — {JORNADA_LABEL[g.jornada] ?? g.jornada}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {!isLoading && !error && (
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex gap-3 flex-wrap items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o ID…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>

          {/* Grado filter (only if docente has multiple grados) */}
          {(perfil?.grados.length ?? 0) > 1 && (
            <select
              value={gradoFilter}
              onChange={(e) => setGradoFilter(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
              className="px-3 py-2.5 rounded-lg border border-outline-variant bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="TODOS">Todos los grados</option>
              {perfil?.grados.map((g) => (
                <option key={g.id_grado} value={g.id_grado}>
                  {g.nombre} — {JORNADA_LABEL[g.jornada]}
                </option>
              ))}
            </select>
          )}

          {/* Counter */}
          <span className="text-xs text-stone-400 ml-auto">
            {filtered.length} estudiante{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24 gap-3">
          <span className="material-symbols-outlined text-primary animate-spin text-5xl">progress_activity</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border border-error/20">
          <span className="material-symbols-outlined text-error text-xl">error</span>
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
      )}

      {/* Stats row */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total estudiantes', value: filtered.length, icon: 'group' },
            { label: 'Grado(s) asignado(s)', value: perfil?.grados.length ?? 0, icon: 'school' },
            { label: 'Jornada',  value: JORNADA_LABEL[perfil?.jornada ?? ''] ?? '—', icon: 'schedule' },
            { label: 'Año lectivo', value: year, icon: 'calendar_today' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-outline-variant shadow-sm px-4 py-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
              <div>
                <p className="text-lg font-black text-on-surface leading-none">{value}</p>
                <p className="text-xs text-stone-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student list */}
      {!isLoading && !error && (
        filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-outline-variant shadow-sm py-20 flex flex-col items-center gap-3 text-stone-400">
            <span className="material-symbols-outlined text-6xl">group_off</span>
            <p className="font-semibold text-sm">
              {search ? 'Sin resultados para esa búsqueda' : `No hay estudiantes matriculados en ${year}`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((m, idx) => (
              <EstudianteGradoCard key={m.id_matricula} matricula={m} index={idx + 1} />
            ))}
          </div>
        )
      )}
    </>
  );
};

export default MiGradoPage;