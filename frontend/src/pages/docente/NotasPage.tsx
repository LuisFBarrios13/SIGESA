// src/pages/docente/NotasPage.tsx
// Diseño: lista de estudiantes a la izquierda, panel de notas a la derecha.
// El docente selecciona un estudiante y rellena: nota, fallas e I.H. por materia,
// más el puesto del periodo.

import { useNotasDocente }      from '../../hooks/useNotasDocente';
import EstudianteNotasPanel     from '../../components/docente/EstudianteNotasPanel';
import ListaEstudiantesNotas from '../../components/docente/ListaEstudiantesNotas';
import { iniciales } from '../../utils/iniciales';

const PERIODOS = [1, 2, 3, 4] as const;
const yearOptions = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 1 + i);

const NotasPage = () => {
  const {
    isSetupLoading, setupError, perfil,
    periodo, setPeriodo,
    year, setYear,
    search, setSearch, gradoFilter, setGradoFilter, filtered, isLoadingStudents,
    selected, selectStudent,
    materias, isLoadingNotas, notasError,
    updateNota, updateFallas, updateIH,
    puesto, savedPuesto, updatePuesto,
    observaciones, updateObservaciones,
    isSaving, saveError, saveSuccess, hasDirty, handleSave,
  } = useNotasDocente();

  const dirtyCount = materias.filter((m) => m.dirty).length;

  const handleBoletin = () => {
    if (!selected) return;
    window.open(`/docente/boletin?matricula=${selected.id_matricula}&year=${year}&periodo=${periodo}`, '_blank');
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
            onChange={(e) => setYear(Number(e.target.value))}
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
        <ListaEstudiantesNotas
          perfil={perfil}
          estudiantes={filtered}
          isLoading={isLoadingStudents}
          selected={selected}
          onSelect={selectStudent}
          search={search}
          onSearch={setSearch}
          gradoFilter={gradoFilter}
          onGradoFilter={setGradoFilter}
        />

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
                        {iniciales(selected.estudiante.nombre)}
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