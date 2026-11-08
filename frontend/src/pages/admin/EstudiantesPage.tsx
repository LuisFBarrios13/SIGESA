// src/pages/admin/EstudiantesPage.tsx
import { useState, useEffect, useMemo, Fragment } from 'react';
import { estudiantesApi, type EstudianteListItem } from '../../services/api';
import { useEditarEstudiante }   from '../../hooks/useEditarEstudiante';
import { useEditarAcudiente }    from '../../hooks/useEditarAcudiente';
import EditarEstudianteModal     from '../../components/estudiantes/EditarEstudianteModal';
import EditarAcudienteModal      from '../../components/estudiantes/EditarAcudienteModal';
import AcudientesPanel           from '../../components/estudiantes/AcudientesPanel';
import FilterSelect              from '../../components/estudiantes/FilterSelect';
import StatsBar                  from '../../components/estudiantes/StatsBar';
import StudentCard               from '../../components/estudiantes/StudentCard';
import StudentRow                from '../../components/estudiantes/StudentRow';
import { NOMBRES_GRADOS, getMatriculaActiva } from '../../constants/estudiantes';

// ── Main Page ─────────────────────────────────────────────────

type ViewMode = 'cards' | 'table';

const EstudiantesPage = () => {
  const [estudiantes, setEstudiantes] = useState<EstudianteListItem[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [viewMode, setViewMode]       = useState<ViewMode>('table');

  const [search, setSearch]               = useState('');
  const [filterGrado, setFilterGrado]     = useState('');
  const [filterYear, setFilterYear]       = useState('');
  const [filterJornada, setFilterJornada] = useState('');
  const [filterEstado, setFilterEstado]   = useState('');

  const {
    editando: estudianteEditando, isLoading: editEstLoading, error: editEstError,
    abrirEdicion: abrirEdicionEstudiante, cerrarEdicion: cerrarEdicionEstudiante,
    confirmarEdicion: confirmarEdicionEstudiante,
  } = useEditarEstudiante();

  const {
    panel, abrirPanel, cerrarPanel,
    editando: acudienteEditando, isLoading: editAcuLoading, error: editAcuError,
    abrirEdicion: abrirEdicionAcudiente, cerrarEdicion: cerrarEdicionAcudiente,
    confirmarEdicion: confirmarEdicionAcudiente,
  } = useEditarAcudiente();

  const fetchEstudiantes = () => {
    setIsLoading(true); setError('');
    estudiantesApi.listar()
      .then(setEstudiantes)
      .catch(() => setError('No se pudo cargar la lista de estudiantes.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchEstudiantes(); }, []);

  const years = useMemo(() => {
    const set = new Set<string>();
    estudiantes.forEach((e) => e.matriculas.forEach((m) => set.add(String(m.year))));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [estudiantes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return estudiantes.filter((e) => {
      if (q && !e.nombre.toLowerCase().includes(q) && !e.numero_identidad.toLowerCase().includes(q)) return false;
      const m = getMatriculaActiva(e.matriculas);
      if (filterGrado   && m?.grado?.nombre  !== filterGrado)   return false;
      if (filterYear    && String(m?.year)   !== filterYear)    return false;
      if (filterJornada && m?.grado?.jornada !== filterJornada) return false;
      if (filterEstado  && m?.estado         !== filterEstado)  return false;
      return true;
    });
  }, [estudiantes, search, filterGrado, filterYear, filterJornada, filterEstado]);

  const hasFilters = !!(search || filterGrado || filterYear || filterJornada || filterEstado);
  const clearFilters = () => {
    setSearch(''); setFilterGrado(''); setFilterYear(''); setFilterJornada(''); setFilterEstado('');
  };

  const handleEditEstudianteSuccess = (actualizado: EstudianteListItem) => {
    setEstudiantes((prev) =>
      prev.map((e) =>
        e.numero_identidad === actualizado.numero_identidad
          ? { ...actualizado, matriculas: e.matriculas }
          : e,
      ),
    );
  };

  return (
    <>
      {estudianteEditando && (
        <EditarEstudianteModal
          key={estudianteEditando.numero_identidad}
          estudiante={estudianteEditando} isLoading={editEstLoading} error={editEstError}
          onClose={cerrarEdicionEstudiante}
          onConfirm={(p) => confirmarEdicionEstudiante(p, handleEditEstudianteSuccess)}
        />
      )}
      {acudienteEditando && (
        <EditarAcudienteModal
          key={acudienteEditando.cedula}
          acudiente={acudienteEditando} nombreEstudiante={panel.nombreEstudiante}
          isLoading={editAcuLoading} error={editAcuError}
          onClose={cerrarEdicionAcudiente}
          onConfirm={(p) => confirmarEdicionAcudiente(p, () => {})}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Estudiantes</h1>
          <p className="text-base text-stone-500 mt-1">
            Consulta, filtra y edita los datos de estudiantes y acudientes.
          </p>
        </div>
        <button onClick={fetchEstudiantes}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-outline-variant
            text-on-surface-variant rounded-lg font-semibold hover:bg-stone-50 transition-all text-sm">
          <span className="material-symbols-outlined text-lg">refresh</span>Actualizar
        </button>
      </div>

      {!isLoading && !error && <StatsBar estudiantes={estudiantes} />}

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-xl">search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o número de identidad…"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg
              text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30
              focus:border-primary focus:bg-white transition-all" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <FilterSelect icon="school" value={filterGrado} onChange={setFilterGrado}
            placeholder="Todos los grados"
            options={NOMBRES_GRADOS.map((g) => ({ value: g, label: g }))} />
          <FilterSelect icon="wb_sunny" value={filterJornada} onChange={setFilterJornada}
            placeholder="Todas las jornadas"
            options={[{ value: 'MAÑANA', label: 'Mañana' }, { value: 'TARDE', label: 'Tarde' }]} />
          <FilterSelect icon="calendar_today" value={filterYear} onChange={setFilterYear}
            placeholder="Todos los años" options={years.map((y) => ({ value: y, label: y }))} />
          <FilterSelect icon="flag" value={filterEstado} onChange={setFilterEstado}
            placeholder="Todos los estados"
            options={[
              { value: 'ACTIVO', label: 'Activo' },
              { value: 'RETIRADO', label: 'Retirado' },
              { value: 'GRADUADO', label: 'Graduado' },
            ]} />
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold
                text-error border border-error/30 bg-error-container/30 rounded-lg hover:bg-error-container/60 transition-colors">
              <span className="material-symbols-outlined text-[15px]">filter_list_off</span>Limpiar
            </button>
          )}
          <div className="ml-auto flex items-center gap-1 bg-stone-100 rounded-lg p-1">
            {(['table', 'cards'] as ViewMode[]).map((m) => (
              <button key={m} onClick={() => { setViewMode(m); cerrarPanel(); }}
                title={m === 'table' ? 'Vista tabla' : 'Vista tarjetas'}
                className={`p-1.5 rounded-md transition-colors ${viewMode === m
                  ? 'bg-white shadow-sm text-primary' : 'text-stone-400 hover:text-stone-600'}`}>
                <span className="material-symbols-outlined text-xl">{m === 'table' ? 'table_rows' : 'grid_view'}</span>
              </button>
            ))}
          </div>
        </div>
        {!isLoading && (
          <p className="text-xs text-stone-400">
            {hasFilters
              ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} de ${estudiantes.length} estudiantes`
              : `${estudiantes.length} estudiante${estudiantes.length !== 1 ? 's' : ''} en total`}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border border-error/20">
          <span className="material-symbols-outlined text-error text-xl">error</span>
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-primary animate-spin text-5xl">progress_activity</span>
            <p className="text-sm text-stone-400">Cargando estudiantes…</p>
          </div>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-outline-variant shadow-sm
          py-20 flex flex-col items-center gap-4 text-stone-400">
          <span className="material-symbols-outlined text-6xl">{hasFilters ? 'manage_search' : 'group_off'}</span>
          <div className="text-center">
            <p className="font-semibold text-sm">
              {hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay estudiantes registrados'}
            </p>
            <p className="text-xs mt-1">
              {hasFilters ? 'Prueba con otros filtros o limpia la búsqueda.' : 'Aparecerán aquí una vez matriculados.'}
            </p>
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-4 py-2 text-xs font-semibold text-primary border border-primary/30
                rounded-lg hover:bg-primary-fixed/20 transition-colors">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Vista tarjetas */}
      {!isLoading && !error && filtered.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <StudentCard key={e.numero_identidad} estudiante={e}
              onEditarEstudiante={abrirEdicionEstudiante}
              onVerAcudientes={abrirPanel}
              panelAbierto={panel.idEstudiante === e.numero_identidad} />
          ))}
        </div>
      )}

      {/* Vista tabla */}
      {!isLoading && !error && filtered.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/60 flex items-center gap-3">
            <div className="p-2 bg-primary-fixed rounded-lg">
              <span className="material-symbols-outlined text-on-primary-fixed-variant text-xl">group</span>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">Lista de estudiantes</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {filtered.length} estudiante{filtered.length !== 1 ? 's' : ''}{hasFilters && ' (filtrado)'}
                {' '}· Pasa el cursor para ver las acciones de edición
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  {['Estudiante', 'Grado', 'Jornada', 'Año', 'Nacimiento', 'Estado', 'Fecha matrícula', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold text-stone-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <Fragment key={e.numero_identidad}>
                    <StudentRow
                      estudiante={e}
                      onEditarEstudiante={abrirEdicionEstudiante}
                      onVerAcudientes={abrirPanel}
                      panelAbierto={panel.idEstudiante === e.numero_identidad}
                    />
                    {panel.idEstudiante === e.numero_identidad && (
                      <AcudientesPanel
                        acudientes={panel.acudientes}
                        isLoading={panel.isLoading}
                        error={panel.error}
                        onEditar={abrirEdicionAcudiente}
                        colSpan={8}
                      />
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default EstudiantesPage;