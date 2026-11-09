// src/pages/admin/EstudiantesPage.tsx
// Lista de estudiantes con filtros, edición, acudientes y gestión de matrícula.
// Las consultas, mutaciones y modales no cambian; solo el diseño.
//
// Cada fila muestra la matrícula del año en curso (o la del año filtrado): la
// misma que usan Deudores y el botón de retirar/reactivar. Antes se mostraba la
// del año más reciente, y un estudiante ya matriculado para el año siguiente
// aparecía con otro grado y año que en Deudores.
import { useState, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { estudiantesApi, type EstudianteListItem } from '../../services/api';
import { useEditarEstudiante }   from '../../hooks/useEditarEstudiante';
import { useEditarAcudiente }    from '../../hooks/useEditarAcudiente';
import EditarEstudianteModal     from '../../components/estudiantes/EditarEstudianteModal';
import EditarAcudienteModal      from '../../components/estudiantes/EditarAcudienteModal';
import AcudientesPanel, { AcudientesLista } from '../../components/estudiantes/AcudientesPanel';
import FilterSelect              from '../../components/estudiantes/FilterSelect';
import StudentCard               from '../../components/estudiantes/StudentCard';
import StudentRow                from '../../components/estudiantes/StudentRow';
import { NOMBRES_GRADOS, aniosPosteriores, getMatriculaVigente, matriculaMostrada } from '../../constants/estudiantes';
import { queryKeys } from '../../lib/queryKeys';
import { useGestionMatricula } from '../../hooks/useGestionMatricula';
import { useRestablecerClave } from '../../hooks/useRestablecerClave';
import GestionMatriculaDialogos from '../../components/estudiantes/GestionMatriculaDialogos';
import RestablecerClaveDialogos from '../../components/ui/RestablecerClaveDialogos';
import PageHeader from '../../components/ds/PageHeader';
import StatCard   from '../../components/ds/StatCard';
import Tarjeta    from '../../components/ds/Tarjeta';
import { Boton, Icono } from '../../components/ds/Controles';
import { Aviso, Cargando } from '../../components/ds/Estados';

const SIN_ESTUDIANTES: EstudianteListItem[] = [];
// Nacimiento y fecha de matrícula se ocultan en pantallas más angostas para que la tabla quepa.
const COLUMNAS: { titulo: string; clase?: string }[] = [
  { titulo: 'Estudiante' }, { titulo: 'Grado' }, { titulo: 'Jornada' }, { titulo: 'Año' },
  { titulo: 'Nacimiento', clase: 'hidden xl:table-cell' }, { titulo: 'Estado' },
  { titulo: 'Matrícula', clase: 'hidden 2xl:table-cell' }, { titulo: 'Acciones' },
];

type ViewMode = 'cards' | 'table';

const EstudiantesPage = () => {
  const queryClient = useQueryClient();
  const estudiantesQuery = useQuery({
    queryKey: queryKeys.estudiantes.lista,
    queryFn:  estudiantesApi.listar,
  });
  const estudiantes = estudiantesQuery.data ?? SIN_ESTUDIANTES;
  const isLoading   = estudiantesQuery.isPending;
  const error       = estudiantesQuery.error ? 'No se pudo cargar la lista de estudiantes.' : '';
  const fetchEstudiantes = () => { void estudiantesQuery.refetch(); };

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

  const gestion = useGestionMatricula();
  const clave   = useRestablecerClave();
  const restablecerAcudiente = (a: { cedula: string; nombre: string }) =>
    clave.pedir({ tipo: 'acudiente', cedula: a.cedula, nombre: a.nombre });

  const years = useMemo(() => {
    const set = new Set<string>();
    estudiantes.forEach((e) => e.matriculas.forEach((m) => set.add(String(m.year))));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [estudiantes]);

  // Cada estudiante con la matrícula que se muestra (año filtrado o vigente).
  const conMatricula = useMemo(() => estudiantes.map((e) => {
    const matricula = matriculaMostrada(e.matriculas, filterYear || undefined);
    return {
      e, matricula,
      vigente:     getMatriculaVigente(e.matriculas),
      posteriores: aniosPosteriores(e.matriculas, matricula),
    };
  }), [estudiantes, filterYear]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return conMatricula.filter(({ e, matricula: m }) => {
      if (q && !e.nombre.toLowerCase().includes(q) && !e.numero_identidad.toLowerCase().includes(q)) return false;
      if (filterYear    && !m) return false;
      if (filterGrado   && m?.grado?.nombre  !== filterGrado)   return false;
      if (filterJornada && m?.grado?.jornada !== filterJornada) return false;
      if (filterEstado  && m?.estado         !== filterEstado)  return false;
      return true;
    });
  }, [conMatricula, search, filterGrado, filterYear, filterJornada, filterEstado]);

  const hasFilters = !!(search || filterGrado || filterYear || filterJornada || filterEstado);
  const clearFilters = () => {
    setSearch(''); setFilterGrado(''); setFilterYear(''); setFilterJornada(''); setFilterEstado('');
  };

  const handleEditEstudianteSuccess = (actualizado: EstudianteListItem) => {
    queryClient.setQueryData<EstudianteListItem[]>(queryKeys.estudiantes.lista, (prev = []) =>
      prev.map((e) =>
        e.numero_identidad === actualizado.numero_identidad
          ? { ...actualizado, matriculas: e.matriculas }
          : e,
      ),
    );
  };

  // Resumen sobre la matrícula vigente de cada estudiante
  const total     = estudiantes.length;
  const contar    = (estado: string) => conMatricula.filter(({ vigente }) => vigente?.estado === estado).length;
  const activos   = contar('ACTIVO');
  const retirados = contar('RETIRADO');
  const graduados = contar('GRADUADO');
  const pct = (n: number) => `${total ? Math.round((n / total) * 100) : 0}%`;

  const propsDe = (x: (typeof conMatricula)[number]) => ({
    estudiante:   x.e,
    matricula:    x.matricula,
    vigente:      x.vigente,
    posteriores:  x.posteriores,
    panelAbierto: panel.idEstudiante === x.e.numero_identidad,
    onEditarEstudiante: abrirEdicionEstudiante,
    onVerAcudientes:    abrirPanel,
    onMatricular:       gestion.abrirMatricular,
    onCambiarEstado:    gestion.abrirCambioEstado,
  });
  const propsAcudientes = {
    acudientes: panel.acudientes, isLoading: panel.isLoading, error: panel.error,
    onEditar: abrirEdicionAcudiente, onRestablecerClave: restablecerAcudiente,
  };

  const acciones = (
    <div className="flex flex-wrap items-center gap-3">
      <Boton icono="refresh" onClick={fetchEstudiantes} className="min-h-[52px] rounded-full flex-1 lg:flex-none">
        Actualizar
      </Boton>
      <Link to="/matricula"
        className="inline-flex flex-1 lg:flex-none items-center justify-center gap-2 min-h-[52px] px-5 rounded-full whitespace-nowrap
          bg-vino text-white text-sm font-semibold hover:bg-vino-hover transition-colors">
        <Icono nombre="person_add" className="hidden sm:inline text-[19px]" />Nueva matrícula
      </Link>
    </div>
  );

  const tarjetas = (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {filtered.map((x) => (
        <StudentCard key={x.e.numero_identidad} {...propsDe(x)} panel={<AcudientesLista {...propsAcudientes} />} />
      ))}
    </div>
  );

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
      <RestablecerClaveDialogos clave={clave} />

      <PageHeader titulo="Estudiantes" subtitulo="Consulta, filtra y edita los datos de estudiantes y acudientes"
        acciones={acciones} />

      <GestionMatriculaDialogos gestion={gestion} />

      {!isLoading && !error && (
        <section aria-label="Resumen de estudiantes" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
          <StatCard icono="group" etiqueta="Total" valor={total} tono="vino" chip="Todos" />
          <StatCard icono="check_circle" etiqueta="Activos" valor={activos} tono="verde" chip={pct(activos)} />
          <StatCard icono="person_off" etiqueta="Retirados" valor={retirados} tono="neutro" chip={pct(retirados)} />
          <StatCard icono="school" etiqueta="Graduados" valor={graduados} tono="dorado" chip={pct(graduados)} />
        </section>
      )}

      <Tarjeta>
        {/* Búsqueda y filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2.5 min-h-12 px-3.5 rounded-[14px] bg-crema text-tinta-suave basis-full 2xl:basis-auto 2xl:flex-[1_1_260px]">
            <Icono nombre="search" className="text-xl" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o número de identidad" aria-label="Buscar estudiante"
              className="flex-1 min-w-0 bg-transparent text-[15px] text-tinta placeholder:text-tinta-suave focus:outline-none" />
          </label>
          <FilterSelect icon="school" value={filterGrado} onChange={setFilterGrado} placeholder="Todos los grados"
            options={NOMBRES_GRADOS.map((g) => ({ value: g, label: g }))} />
          <FilterSelect icon="wb_sunny" value={filterJornada} onChange={setFilterJornada} placeholder="Todas las jornadas"
            options={[{ value: 'MAÑANA', label: 'Mañana' }, { value: 'TARDE', label: 'Tarde' }]} />
          <FilterSelect icon="calendar_today" value={filterYear} onChange={setFilterYear} placeholder="Año en curso"
            options={years.map((y) => ({ value: y, label: y }))} />
          <FilterSelect icon="flag" value={filterEstado} onChange={setFilterEstado} placeholder="Todos los estados"
            options={[
              { value: 'ACTIVO', label: 'Activo' },
              { value: 'RETIRADO', label: 'Retirado' },
              { value: 'GRADUADO', label: 'Graduado' },
            ]} />
          {hasFilters && (
            <Boton icono="filter_list_off" variante="suave" onClick={clearFilters} className="min-h-12">Limpiar</Boton>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="m-0 text-base md:text-xl font-semibold">Lista de estudiantes</h2>
            {!isLoading && (
              <span className="text-sm text-tinta-suave">
                {hasFilters ? `${filtered.length} de ${total} estudiantes` : `${total} estudiante${total !== 1 ? 's' : ''}`}
                {!filterYear && ' · matrícula del año en curso'}
              </span>
            )}
          </div>
          <div role="group" aria-label="Vista" className="hidden md:flex gap-1 bg-crema rounded-xl p-1">
            {(['table', 'cards'] as ViewMode[]).map((m) => (
              <button key={m} type="button" onClick={() => { setViewMode(m); cerrarPanel(); }}
                aria-pressed={viewMode === m} aria-label={m === 'table' ? 'Vista de tabla' : 'Vista de tarjetas'}
                className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors ${
                  viewMode === m ? 'bg-tarjeta text-vino' : 'text-tinta-media hover:text-tinta'}`}>
                <Icono nombre={m === 'table' ? 'table_rows' : 'grid_view'} className="text-xl" />
              </button>
            ))}
          </div>
        </div>

        {error && <Aviso icono="error" titulo={error} enTarjeta={false} />}
        {isLoading && <Cargando texto="Cargando estudiantes…" />}

        {!isLoading && !error && filtered.length === 0 && (
          <Aviso enTarjeta={false} icono={hasFilters ? 'manage_search' : 'group_off'}
            titulo={hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay estudiantes registrados'}
            texto={hasFilters ? 'Prueba con otros filtros o limpia la búsqueda.' : 'Aparecerán aquí una vez matriculados.'}>
            {hasFilters && <Boton variante="suave" onClick={clearFilters}>Limpiar filtros</Boton>}
          </Aviso>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <>
            {/* Celular: siempre tarjetas. Escritorio: la vista elegida. */}
            <div className={viewMode === 'cards' ? '' : 'md:hidden'}>{tarjetas}</div>

            {viewMode === 'table' && (
              <div className="relative hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-sm text-left">
                  <caption className="sr-only">Estudiantes</caption>
                  <thead>
                    <tr className="bg-crema">
                      {COLUMNAS.map(({ titulo: h, clase = '' }, i) => (
                        <th key={h} scope="col"
                          className={`${clase} px-3 py-3.5 font-semibold text-tinta whitespace-nowrap
                            ${i === 0 ? 'rounded-l-xl' : ''} ${i === COLUMNAS.length - 1 ? 'rounded-r-xl' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((x) => (
                      <Fragment key={x.e.numero_identidad}>
                        <StudentRow {...propsDe(x)} />
                        {panel.idEstudiante === x.e.numero_identidad && (
                          <AcudientesPanel colSpan={COLUMNAS.length} {...propsAcudientes} />
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Tarjeta>
    </>
  );
};

export default EstudiantesPage;
