// src/pages/admin/EstudiantesPage.tsx
import { useState, useEffect, useMemo } from 'react';
import {
  estudiantesApi,
  type EstudianteListItem,
  type MatriculaListItem,
} from '../../services/api';
import { useEditarEstudiante }   from '../../hooks/useEditarEstudiante';
import { useEditarAcudiente }    from '../../hooks/useEditarAcudiente';
import EditarEstudianteModal     from '../../components/estudiantes/EditarEstudianteModal';
import EditarAcudienteModal      from '../../components/estudiantes/EditarAcudienteModal';
import type { AcudienteDetalle } from '../../types/acudientes-admin';

// ── Constants ─────────────────────────────────────────────────

const NOMBRES_GRADOS = [
  'Pre Jardín', 'Jardín', 'Transición',
  'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto',
] as const;

const ESTADO_COLOR: Record<string, string> = {
  ACTIVO:   'bg-emerald-100 text-emerald-800',
  RETIRADO: 'bg-red-100 text-red-800',
  GRADUADO: 'bg-blue-100 text-blue-800',
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

// ── Helpers ───────────────────────────────────────────────────

const getMatriculaActiva = (matriculas: MatriculaListItem[]): MatriculaListItem | undefined =>
  [...matriculas].sort((a, b) => b.year - a.year)[0];

// ── Sub-components ────────────────────────────────────────────

interface BadgeProps { label: string; colorClass: string; icon?: string }
const Badge = ({ label, colorClass, icon }: BadgeProps) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>
    {icon && <span className="material-symbols-outlined text-[12px]">{icon}</span>}
    {label}
  </span>
);

interface FilterSelectProps {
  icon: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder: string;
}
const FilterSelect = ({ icon, value, onChange, options, placeholder }: FilterSelectProps) => (
  <div className="relative flex-1 min-w-[160px]">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined
      text-stone-400 text-[18px] pointer-events-none">{icon}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-outline-variant rounded-lg
        text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30
        focus:border-primary transition-colors">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined
      text-stone-400 text-[16px] pointer-events-none">expand_more</span>
  </div>
);

// ── Panel de acudientes (fila expansible dentro de la tabla) ──

interface AcudientesPanelProps {
  acudientes: AcudienteDetalle[];
  isLoading:  boolean;
  error:      string;
  onEditar:   (a: AcudienteDetalle) => void;
  colSpan:    number;
}

const AcudientesPanel = ({ acudientes, isLoading, error, onEditar, colSpan }: AcudientesPanelProps) => (
  <tr>
    <td colSpan={colSpan} className="px-0 py-0">
      <div className="bg-stone-50 border-y border-stone-200 px-8 py-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-stone-400 py-1">
            <span className="material-symbols-outlined text-primary animate-spin text-lg">progress_activity</span>
            <span className="text-sm">Cargando acudientes…</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-error-container rounded-lg border border-error/20">
            <span className="material-symbols-outlined text-error text-lg">error</span>
            <p className="text-xs text-error font-medium">{error}</p>
          </div>
        )}
        {!isLoading && !error && acudientes.length === 0 && (
          <p className="text-xs text-stone-400 italic py-1">Sin acudientes registrados.</p>
        )}
        {!isLoading && acudientes.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
              Acudiente{acudientes.length !== 1 ? 's' : ''}
            </p>
            {acudientes.map((a) => {
              const initials = a.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div key={a.cedula}
                  className="bg-white rounded-xl border border-outline-variant p-4
                    flex items-center gap-4 group">
                  <div className="w-9 h-9 rounded-full bg-secondary-container/30
                    flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-secondary">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-0.5">
                    <div>
                      <p className="font-semibold text-on-surface text-sm truncate">{a.nombre}</p>
                      <p className="text-xs text-stone-400 font-mono">CC {a.cedula}</p>
                    </div>
                    <div className="text-xs text-stone-500 space-y-0.5">
                      {a.telefono && (
                        <p className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-stone-400">phone</span>
                          {a.telefono}
                        </p>
                      )}
                      {a.correo && (
                        <p className="flex items-center gap-1 truncate">
                          <span className="material-symbols-outlined text-[13px] text-stone-400">mail</span>
                          {a.correo}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 space-y-0.5">
                      {a.RelacionEA?.parentesco && (
                        <p className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-stone-400">family_restroom</span>
                          {a.RelacionEA.parentesco}
                        </p>
                      )}
                      {a.RelacionEA?.acudiente_principal && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold
                          px-2 py-0.5 bg-secondary-container/30 text-secondary rounded-full">
                          <span className="material-symbols-outlined text-[11px]">star</span>Principal
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => onEditar(a)} title="Editar acudiente"
                    className="p-1.5 rounded-lg text-stone-300 hover:text-primary
                      hover:bg-primary-fixed/30 transition-all flex-shrink-0
                      opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </td>
  </tr>
);

// ── Student Card (vista tarjeta) ──────────────────────────────

interface StudentCardProps {
  estudiante:         EstudianteListItem;
  onEditarEstudiante: (e: EstudianteListItem) => void;
  onVerAcudientes:    (id: string, nombre: string) => void;
  panelAbierto:       boolean;
}

const StudentCard = ({ estudiante: e, onEditarEstudiante, onVerAcudientes, panelAbierto }: StudentCardProps) => {
  const matricula = getMatriculaActiva(e.matriculas);
  const initials  = e.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition-all group
      ${panelAbierto ? 'border-primary/40 shadow-md' : 'border-outline-variant hover:shadow-md hover:border-primary/30'}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center
          flex-shrink-0 group-hover:bg-primary transition-colors">
          <span className="text-sm font-black text-on-primary-fixed-variant group-hover:text-white transition-colors">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-on-surface text-sm truncate">{e.nombre}</p>
              <p className="text-xs text-stone-500 mt-0.5 font-mono">ID: {e.numero_identidad}</p>
            </div>
            {matricula && (
              <Badge label={matricula.estado}
                colorClass={ESTADO_COLOR[matricula.estado] ?? 'bg-stone-100 text-stone-700'}
                icon={ESTADO_ICON[matricula.estado]} />
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {matricula?.grado && (
              <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700
                px-2.5 py-1 rounded-full font-medium">
                <span className="material-symbols-outlined text-[13px] text-secondary">school</span>
                {matricula.grado.nombre}
              </span>
            )}
            {matricula?.grado?.jornada && (
              <Badge label={matricula.grado.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}
                colorClass={JORNADA_COLOR[matricula.grado.jornada] ?? ''} />
            )}
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t border-stone-100">
            <button onClick={() => onEditarEstudiante(e)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                bg-stone-100 text-stone-700 rounded-lg hover:bg-primary-fixed/30 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[15px]">edit</span>
              Estudiante
            </button>
            <button onClick={() => onVerAcudientes(e.numero_identidad, e.nombre)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                rounded-lg transition-colors
                ${panelAbierto
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-stone-100 text-stone-700 hover:bg-secondary-container/30 hover:text-secondary'
                }`}>
              <span className="material-symbols-outlined text-[15px]">family_restroom</span>
              Acudientes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Student Table Row ─────────────────────────────────────────

interface StudentRowProps {
  estudiante:         EstudianteListItem;
  onEditarEstudiante: (e: EstudianteListItem) => void;
  onVerAcudientes:    (id: string, nombre: string) => void;
  panelAbierto:       boolean;
}

const StudentRow = ({ estudiante: e, onEditarEstudiante, onVerAcudientes, panelAbierto }: StudentRowProps) => {
  const matricula = getMatriculaActiva(e.matriculas);
  return (
    <tr className={`transition-colors group ${panelAbierto ? 'bg-primary-fixed/10' : 'hover:bg-stone-50/70'}`}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-on-primary-fixed-variant">
              {e.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-on-surface text-sm">{e.nombre}</p>
            <p className="text-xs text-stone-400 font-mono">{e.numero_identidad}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-stone-600">{matricula?.grado?.nombre ?? '—'}</td>
      <td className="px-5 py-3.5">
        {matricula?.grado?.jornada
          ? <Badge label={matricula.grado.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}
              colorClass={JORNADA_COLOR[matricula.grado.jornada] ?? ''} />
          : <span className="text-stone-300 text-xs">—</span>}
      </td>
      <td className="px-5 py-3.5 text-sm text-stone-600 font-mono">{matricula?.year ?? '—'}</td>
      <td className="px-5 py-3.5 text-xs text-stone-500">
        {e.fecha_nacimiento
          ? new Date(e.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-CO', {
              day: '2-digit', month: 'short', year: 'numeric' })
          : '—'}
      </td>
      <td className="px-5 py-3.5">
        {matricula
          ? <Badge label={matricula.estado}
              colorClass={ESTADO_COLOR[matricula.estado] ?? 'bg-stone-100 text-stone-700'}
              icon={ESTADO_ICON[matricula.estado]} />
          : <span className="text-stone-300 text-xs">—</span>}
      </td>
      <td className="px-5 py-3.5 text-xs text-stone-500">
        {matricula
          ? new Date(matricula.fecha_matricula).toLocaleDateString('es-CO', {
              day: '2-digit', month: 'short', year: 'numeric' })
          : '—'}
      </td>
      {/* Acciones */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEditarEstudiante(e)} title="Editar estudiante"
            className="p-1.5 rounded-lg text-stone-400 hover:text-primary hover:bg-primary-fixed/30 transition-all">
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button onClick={() => onVerAcudientes(e.numero_identidad, e.nombre)}
            title="Ver / editar acudientes"
            className={`p-1.5 rounded-lg transition-all
              ${panelAbierto
                ? 'text-secondary bg-secondary-container/30'
                : 'text-stone-400 hover:text-secondary hover:bg-secondary-container/20'}`}>
            <span className="material-symbols-outlined text-lg">family_restroom</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

// ── Stats bar ─────────────────────────────────────────────────

const StatsBar = ({ estudiantes }: { estudiantes: EstudianteListItem[] }) => {
  const activos   = estudiantes.filter((e) => getMatriculaActiva(e.matriculas)?.estado === 'ACTIVO').length;
  const retirados = estudiantes.filter((e) => getMatriculaActiva(e.matriculas)?.estado === 'RETIRADO').length;
  const graduados = estudiantes.filter((e) => getMatriculaActiva(e.matriculas)?.estado === 'GRADUADO').length;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'Total', value: estudiantes.length, icon: 'group',        color: 'text-primary',     bg: 'bg-primary-fixed' },
        { label: 'Activos',  value: activos,          icon: 'check_circle', color: 'text-emerald-700', bg: 'bg-emerald-100'   },
        { label: 'Retirados',value: retirados,         icon: 'cancel',       color: 'text-red-700',     bg: 'bg-red-100'       },
        { label: 'Graduados',value: graduados,         icon: 'school',       color: 'text-blue-700',    bg: 'bg-blue-100'      },
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
          estudiante={estudianteEditando} isLoading={editEstLoading} error={editEstError}
          onClose={cerrarEdicionEstudiante}
          onConfirm={(p) => confirmarEdicionEstudiante(p, handleEditEstudianteSuccess)}
        />
      )}
      {acudienteEditando && (
        <EditarAcudienteModal
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
          <FilterSelect icon="school"         value={filterGrado}   onChange={setFilterGrado}
            placeholder="Todos los grados"
            options={NOMBRES_GRADOS.map((g) => ({ value: g, label: g }))} />
          <FilterSelect icon="wb_sunny"       value={filterJornada} onChange={setFilterJornada}
            placeholder="Todas las jornadas"
            options={[{ value: 'MAÑANA', label: 'Mañana' }, { value: 'TARDE', label: 'Tarde' }]} />
          <FilterSelect icon="calendar_today" value={filterYear}    onChange={setFilterYear}
            placeholder="Todos los años" options={years.map((y) => ({ value: y, label: y }))} />
          <FilterSelect icon="flag"           value={filterEstado}  onChange={setFilterEstado}
            placeholder="Todos los estados"
            options={[
              { value: 'ACTIVO', label: 'Activo' }, { value: 'RETIRADO', label: 'Retirado' },
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
                  <>
                    <StudentRow
                      key={e.numero_identidad}
                      estudiante={e}
                      onEditarEstudiante={abrirEdicionEstudiante}
                      onVerAcudientes={abrirPanel}
                      panelAbierto={panel.idEstudiante === e.numero_identidad}
                    />
                    {panel.idEstudiante === e.numero_identidad && (
                      <AcudientesPanel
                        key={`panel-${e.numero_identidad}`}
                        acudientes={panel.acudientes}
                        isLoading={panel.isLoading}
                        error={panel.error}
                        onEditar={abrirEdicionAcudiente}
                        colSpan={8}
                      />
                    )}
                  </>
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