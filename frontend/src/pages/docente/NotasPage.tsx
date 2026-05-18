// src/pages/docente/NotasPage.tsx
// Diseño: lista de estudiantes a la izquierda, panel de notas a la derecha.
// El docente selecciona un estudiante y rellena: nota, fallas e I.H. por materia,
// más el puesto del periodo.

import { useNavigate }          from 'react-router-dom';
import { useNotasDocente }      from '../../hooks/useNotasDocente';
import EstudianteNotasPanel     from '../../components/docente/EstudianteNotasPanel';

const PERIODOS = [1, 2, 3, 4] as const;
const yearOptions = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 1 + i);

const JORNADA_COLORS: Record<string, string> = {
  MAÑANA: 'bg-amber-100 text-amber-800',
  TARDE:  'bg-indigo-100 text-indigo-800',
};

const NotasPage = () => {
  const navigate = useNavigate();

  const {
    isSetupLoading, setupError, perfil,
    periodo, setPeriodo,
    year, setYear,
    search, setSearch, gradoFilter, setGradoFilter, filtered, isLoadingStudents,
    selected, selectStudent, clearSelected,
    materias, isLoadingNotas, notasError,
    updateNota, updateFallas, updateIH, updateObs,
    puesto, savedPuesto, updatePuesto,
    observaciones, updateObservaciones,
    isSaving, saveError, saveSuccess, hasDirty, handleSave,
  } = useNotasDocente();

  const dirtyCount = materias.filter((m) => m.dirty).length;

  const handleBoletin = () => {
    if (!selected) return;
    window.open(`/docente/boletin?matricula=${selected.id_matricula}&year=${year}`, '_blank');
  };

  if (isSetupLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="material-symbols-outlined text-primary animate-spin text-5xl">
          progress_activity
        </span>
      </div>
    );
  }

  if (setupError) {
    return (
      <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border border-error/20">
        <span className="material-symbols-outlined text-error text-xl">error</span>
        <p className="text-sm text-error font-medium">{setupError}</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Registro de Notas</h1>
          <p className="text-base text-stone-500 mt-1">
            Selecciona un estudiante · ingresa notas, fallas y puesto del periodo
          </p>
        </div>

        {/* Periodo + Año */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
            {PERIODOS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all
                  ${periodo === p
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-stone-500 hover:text-on-surface'
                  }`}
              >
                P{p}
              </button>
            ))}
          </div>

          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); clearSelected(); }}
            className="px-3 py-2 rounded-lg border border-outline-variant bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium cursor-pointer"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── Layout: lista | panel ───────────────────────────────────────────── */}
      <div className="flex gap-5" style={{ minHeight: 'calc(100vh - 220px)' }}>

        {/* ── Columna izquierda: lista de estudiantes ── */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">

          {/* Buscador */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined
              text-stone-400 text-xl pointer-events-none">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre o ID…"
              className="w-full pl-10 pr-8 py-2.5 text-sm bg-white border border-outline-variant
                rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30
                focus:border-primary transition-all"
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

          {/* Filtro por grado — solo si el docente tiene más de un grado */}
          {(perfil?.grados.length ?? 0) > 1 && (
            <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
              <button
                onClick={() => setGradoFilter('TODOS')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all
                  ${gradoFilter === 'TODOS'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-stone-500 hover:text-on-surface'
                  }`}
              >
                Todos
              </button>
              {perfil!.grados.map((g) => (
                <button
                  key={g.id_grado}
                  onClick={() => setGradoFilter(g.id_grado)}
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
                {isLoadingStudents
                  ? 'Cargando…'
                  : `${filtered.length} estudiante${filtered.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {isLoadingStudents ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined text-primary animate-spin text-2xl">
                  progress_activity
                </span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2 text-stone-400">
                <span className="material-symbols-outlined text-4xl">person_search</span>
                <p className="text-xs">Sin resultados</p>
              </div>
            ) : (
              <ul
                className="divide-y divide-stone-50 overflow-y-auto"
                style={{ maxHeight: 'calc(100vh - 290px)' }}
              >
                {filtered.map((m) => {
                  const isSelected = selected?.id_matricula === m.id_matricula;
                  const initials   = m.estudiante.nombre
                    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

                  return (
                    <li key={m.id_matricula}>
                      <button
                        onClick={() => selectStudent(m)}
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
                          {initials}
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

        {/* ── Columna derecha: panel de notas ── */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="bg-white rounded-xl border border-outline-variant shadow-sm
              h-full flex flex-col items-center justify-center gap-4 text-stone-400 py-20">
              <span className="material-symbols-outlined text-6xl">touch_app</span>
              <div className="text-center">
                <p className="font-semibold text-sm text-on-surface">
                  Selecciona un estudiante
                </p>
                <p className="text-xs mt-1">
                  Haz clic en un nombre para ver sus materias
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">

              {/* Header del estudiante seleccionado */}
              <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/60">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center
                      justify-center flex-shrink-0">
                      <span className="text-sm font-black text-white">
                        {selected.estudiante.nombre
                          .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface text-base">
                        {selected.estudiante.nombre}
                      </h3>
                      <p className="text-xs text-stone-500">
                        CC {selected.estudiante.numero_identidad} ·{' '}
                        {selected.grado.nombre} ·{' '}
                        Periodo {periodo} · {year}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleBoletin}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                        bg-green-50 text-green-800 border border-green-200 rounded-lg
                        hover:bg-green-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">description</span>
                      Boletín PDF
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={!hasDirty || isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-on-secondary
                        rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-sm
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <span className="material-symbols-outlined text-base animate-spin">
                            progress_activity
                          </span>
                          Guardando…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">save</span>
                          Guardar{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Feedback */}
                {saveSuccess && (
                  <div className="flex items-center gap-2 mt-3 p-2.5 bg-secondary-container/20
                    rounded-lg border border-secondary/30">
                    <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                    <p className="text-xs text-secondary font-semibold">
                      Notas, fallas y puesto guardados correctamente
                    </p>
                  </div>
                )}
                {saveError && (
                  <div className="flex items-center gap-2 mt-3 p-2.5 bg-error-container
                    rounded-lg border border-error/20">
                    <span className="material-symbols-outlined text-error text-lg">error</span>
                    <p className="text-xs text-error font-medium">{saveError}</p>
                  </div>
                )}
                {hasDirty && !saveSuccess && !saveError && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <p className="text-xs text-orange-700 font-medium">
                      Cambios sin guardar
                    </p>
                  </div>
                )}
              </div>

              {/* Panel de materias */}
              <EstudianteNotasPanel
                materias={materias}
                isLoading={isLoadingNotas}
                error={notasError}
                onNota={updateNota}
                onFallas={updateFallas}
                onIH={updateIH}
                puesto={puesto}
                savedPuesto={savedPuesto}
                onPuesto={updatePuesto}
                observaciones={observaciones}
                onObservaciones={updateObservaciones}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotasPage;