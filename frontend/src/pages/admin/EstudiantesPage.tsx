// src/pages/admin/EstudiantesPage.tsx — listado y ficha de estudiantes.
// Diseño: docs/Estudiantes · Modo claro@1x.png y Estudiantes · Modo oscuro@1x.png.
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentType, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { estudiantesApi, gradosApi, matriculasApi, clavesApi } from '../../services/api';
import { pagosApi, type ResumenPagos } from '../../services/pagosApi';
import type { EstudianteDetalle, EstudianteListItem, MatriculaListItem, Sexo, TipoDocumento } from '../../types/estudiantes';
import type { Grado, Credenciales } from '../../types/shared';
import { NOMBRE_ESTADO } from '../../types/matriculas';
import type { Seccion } from '../../layouts/AdminLayout';
import { ESCALA_CONTENIDO, ID_CAPA } from '../../layouts/escala';
import { Progreso } from '../../components/panel';
import { GIRO_MINIMO_MS } from '../../hooks/useDashboard';
import {
  dineroCorto, documento, edad, fechaDia, fechaEncabezado, iniciales, MESES_LARGOS,
} from '../../utils/formato';
import * as I from '../../components/iconos';

type Estado = MatriculaListItem['estado'];
type FiltroYear = 'actual' | 'todos' | number;
type PestanaFicha = 'datos' | 'acudientes' | 'matriculas' | 'pagos';

interface Props {
  onIr: (s: Seccion) => void;
  /** Ficha que se abre al entrar (desde el buscador de arriba). */
  abrirId: string | null;
  onAbierto: () => void;
}

/** Fila del listado: el estudiante con la matrícula que corresponde al año elegido. */
interface Fila {
  e: EstudianteListItem;
  m: MatriculaListItem | null;
  /** Otros años matriculados (p. ej. "también 2027"). */
  otrosYears: number[];
}

const YEAR_ACTUAL = new Date().getFullYear();

/** Últimos datos cargados: al volver a la sección se muestran al instante mientras se actualizan. */
const cache: { estudiantes: EstudianteListItem[] | null; grados: Grado[] } = { estudiantes: null, grados: [] };

/** Filas de relleno mientras llegan los datos la primera vez (así la tabla no cambia de tamaño). */
const FILAS_ESQUELETO = 8;
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const pct = (parte: number, total: number) => (total > 0 ? Math.round((parte / total) * 100) : 0);

export default function EstudiantesPage({ onIr, abrirId, onAbierto }: Props) {
  const [estudiantes, setEstudiantes] = useState<EstudianteListItem[] | null>(cache.estudiantes);
  const [grados, setGrados] = useState<Grado[]>(cache.grados);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  // Filtros
  const [q, setQ] = useState('');
  const [fGrado, setFGrado] = useState<number | ''>('');
  const [fJornada, setFJornada] = useState<'' | 'MAÑANA' | 'TARDE'>('');
  const [fYear, setFYear] = useState<FiltroYear>('actual');
  const [fEstado, setFEstado] = useState<'' | Estado>('');
  // En celular y tablet la tabla no cabe: ahí arranca en tarjetas.
  const [vista, setVista] = useState<'lista' | 'tarjetas'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 64rem)').matches ? 'lista' : 'tarjetas');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Ficha y diálogos
  const [ficha, setFicha] = useState<{ id: string; pestana: PestanaFicha } | null>(null);
  /** Veces que se guardaron datos: la ficha abierta se vuelve a cargar. */
  const [versionFicha, setVersionFicha] = useState(0);
  const [editando, setEditando] = useState<EstudianteListItem | null>(null);
  const [cambioEstado, setCambioEstado] = useState<{ e: EstudianteListItem; m: MatriculaListItem } | null>(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let vigente = true;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const inicio = Date.now();
    setCargando(true);
    Promise.all([estudiantesApi.listar(), gradosApi.listar()])
      .then(([es, gs]) => {
        cache.estudiantes = es;
        cache.grados = gs;
        if (vigente) { setEstudiantes(es); setGrados(gs); setError(''); }
      })
      .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudieron cargar los estudiantes.'); })
      .finally(() => {
        // Que el ícono alcance a girar aunque el servidor responda al instante.
        espera = setTimeout(() => { if (vigente) setCargando(false); }, Math.max(0, GIRO_MINIMO_MS - (Date.now() - inicio)));
      });
    return () => { vigente = false; clearTimeout(espera); };
  }, [version]);

  const recargar = useCallback(() => setVersion(v => v + 1), []);

  // Ficha pedida desde el buscador de arriba
  useEffect(() => {
    if (!abrirId) return;
    setFicha({ id: abrirId, pestana: 'datos' });
    onAbierto();
  }, [abrirId, onAbierto]);

  // El aviso se oculta solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const yearElegido = fYear === 'actual' ? YEAR_ACTUAL : fYear;

  /** Cada estudiante con su matrícula del año elegido (o la más reciente si son todos los años). */
  const base = useMemo<Fila[]>(() => {
    if (!estudiantes) return [];
    return estudiantes.flatMap(e => {
      const ordenadas = [...e.matriculas].sort((a, b) => b.year - a.year);
      const m = yearElegido === 'todos' ? ordenadas[0] ?? null : ordenadas.find(x => x.year === yearElegido) ?? null;
      if (yearElegido !== 'todos' && !m) return [];
      return [{ e, m, otrosYears: ordenadas.filter(x => x !== m).map(x => x.year).filter(y => y > (m?.year ?? 0)) }];
    });
  }, [estudiantes, yearElegido]);

  const filas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return base.filter(({ e, m }) =>
      (!texto || e.nombre.toLowerCase().includes(texto) || e.numero_identidad.includes(texto)) &&
      (fGrado === '' || m?.grado?.id_grado === fGrado) &&
      (fJornada === '' || m?.jornada === fJornada) &&
      (fEstado === '' || m?.estado === fEstado));
  }, [base, q, fGrado, fJornada, fEstado]);

  const conteo = useMemo(() => {
    const c: Record<Estado, number> & { total: number } = { total: base.length, ACTIVO: 0, PROMOCION: 0, RETIRADO: 0, FINALIZADO: 0 };
    for (const { m } of base) if (m) c[m.estado]++;
    return c;
  }, [base]);

  const years = useMemo(() => {
    const s = new Set<number>([YEAR_ACTUAL]);
    estudiantes?.forEach(e => e.matriculas.forEach(m => s.add(m.year)));
    return [...s].sort((a, b) => b - a);
  }, [estudiantes]);


  const abrirFicha = (id: string, pestana: PestanaFicha = 'datos') => setFicha({ id, pestana });

  const filtrosActivos = [fGrado !== '', fJornada !== '', fYear !== 'actual', fEstado !== ''].filter(Boolean).length;
  const limpiarFiltros = () => { setFGrado(''); setFJornada(''); setFYear('actual'); setFEstado(''); };

  /** Los mismos cuatro filtros en la fila del computador y en el panel del celular. */
  const filtros = (ancho: string) => (
    <>
      <Filtro ancho={ancho} Icono={I.Birrete} etiqueta="Grado" valor={String(fGrado)} onCambio={v => setFGrado(v ? Number(v) : '')}
        opciones={[['', 'Todos los grados'], ...gradosUnicos(grados).map(g => [String(g.id_grado), `${g.nombre} · ${capitalizar(g.jornada)}`] as [string, string])]} />
      <Filtro ancho={ancho} Icono={I.SolRayos} etiqueta="Jornada" valor={fJornada} onCambio={v => setFJornada(v as typeof fJornada)}
        opciones={[['', 'Todas las jornadas'], ['MAÑANA', 'Mañana'], ['TARDE', 'Tarde']]} />
      <Filtro ancho={ancho} Icono={I.Calendario} etiqueta="Año" valor={String(fYear)} onCambio={v => setFYear(v === 'actual' || v === 'todos' ? v : Number(v))}
        opciones={[['actual', 'Año en curso'], ...years.filter(y => y !== YEAR_ACTUAL).map(y => [String(y), String(y)] as [string, string]), ['todos', 'Todos los años']]} />
      <Filtro ancho={ancho} Icono={I.Bandera} etiqueta="Estado" valor={fEstado} onCambio={v => setFEstado(v as typeof fEstado)}
        opciones={[['', 'Todos los estados'], ['ACTIVO', 'Activos'], ['PROMOCION', 'Promoción'], ['RETIRADO', 'Retirados'], ['FINALIZADO', 'Finalizados']]} />
    </>
  );

  return (
    <main className="flex-1 flex flex-col">
      {/* Encabezado */}
      <div className="aparecer flex flex-col gap-3.5 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between lg:gap-4">
        <div>
          <h1 className="text-[28px] lg:text-[32px] leading-tight font-extrabold tracking-tight">Estudiantes</h1>
          <p className="mt-1 text-[10px] lg:text-[11.5px] font-semibold tracking-[0.18em] text-(--p-suave)">{fechaEncabezado(new Date(), true)}</p>
        </div>

        {/* Celular y tablet */}
        <div className="lg:hidden flex items-stretch gap-3 h-12">
          <button
            type="button"
            onClick={recargar}
            aria-label="Actualizar datos"
            title="Actualizar datos"
            className="grid place-items-center shrink-0 w-12 rounded-xl bg-(--p-sup) border border-(--p-borde) hover:bg-(--p-hover)"
          >
            <span className={cargando ? 'animate-[spin_0.7s_linear_infinite]' : ''}><I.Recargar tam={18} /></span>
          </button>
          <button
            type="button"
            onClick={() => onIr('matriculas')}
            className="flex-1 flex items-stretch rounded-xl overflow-hidden bg-(--p-banda) text-white hover:brightness-125 transition"
          >
            <span className="grid place-items-center shrink-0 w-12 bg-white/10"><I.PersonaMas tam={18} /></span>
            <span className="flex-1 grid place-items-center text-[12.5px] font-bold tracking-[0.14em]">NUEVA MATRÍCULA</span>
          </button>
        </div>

        {/* Computador */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Mismos botones y misma posición que en Inicio (ahí el de recargar va dentro del
              recuadro del año, con su borde; aquí se conserva ese borde para que no se mueva). */}
          <div className="flex items-stretch h-11 rounded-xl bg-(--p-sup) border border-(--p-borde) overflow-hidden">
            <button
              type="button"
              onClick={recargar}
              aria-label="Actualizar datos"
              title="Actualizar datos"
              className="grid place-items-center w-11 bg-(--p-acento) text-[#170f27] hover:brightness-105 transition"
            >
              <span className={cargando ? 'animate-[spin_0.7s_linear_infinite]' : ''}><I.Recargar tam={18} /></span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => onIr('matriculas')}
            className="flex items-center gap-2 h-11 px-5 rounded-xl bg-(--p-banda) text-white text-[12.5px] font-bold tracking-[0.12em]
                       hover:brightness-125 transition"
          >
            <I.Mas tam={17} /> NUEVA MATRÍCULA
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-red-300 bg-red-50 px-5 py-3 text-[14px] text-red-700">
          {error}
          <button type="button" onClick={recargar} className="font-bold underline">Reintentar</button>
        </div>
      )}

      {/* Indicadores */}
      <section
        aria-label="Resumen"
        className="aparecer [--i:1] grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 lg:mt-6 lg:gap-0 lg:grid-cols-2 xl:grid-cols-4
                   lg:rounded-[22px] lg:bg-(--p-sup) lg:border lg:border-(--p-borde) lg:overflow-hidden
                   xl:divide-x divide-(--p-borde) transition-colors"
      >
        <Indicador Icono={I.Estudiantes} cuadro="bg-(--p-acento) text-[#170f27]" titulo="Total" insignia="Todos"
          valor={estudiantes ? conteo.total : '—'} pct={conteo.total ? 100 : 0} clave={`t-${version}-${!!estudiantes}`} />
        <Indicador Icono={I.CheckCirculo} cuadro="bg-(--p-icono) text-(--p-acento)" titulo="Activos" insignia={`${pct(conteo.ACTIVO, conteo.total)}%`}
          valor={estudiantes ? conteo.ACTIVO : '—'} pct={pct(conteo.ACTIVO, conteo.total)} clave={`a-${version}-${!!estudiantes}`} />
        <Indicador Icono={I.PersonaX} cuadro="bg-[#adb5b0] text-[#170f27]" titulo="Retirados" insignia={`${pct(conteo.RETIRADO, conteo.total)}%`}
          valor={estudiantes ? conteo.RETIRADO : '—'} pct={pct(conteo.RETIRADO, conteo.total)} oscuro clave={`r-${version}-${!!estudiantes}`} />
        <Indicador Icono={I.Birrete} cuadro="bg-(--p-icono) text-(--p-acento)" titulo="Finalizados" insignia={`${pct(conteo.FINALIZADO, conteo.total)}%`}
          valor={estudiantes ? conteo.FINALIZADO : '—'} pct={pct(conteo.FINALIZADO, conteo.total)} clave={`f-${version}-${!!estudiantes}`} />
      </section>

      {/* Aviso flotante: va por encima de la página y no mueve la tabla,
          así nadie hace clic en el estudiante equivocado cuando aparece. */}
      {aviso && (
        <Capa>
          <div
            role="status"
            style={zoomCapa}
            className="toast fixed z-[60] left-3 right-3 bottom-[96px] sm:left-auto sm:right-6 lg:bottom-6 sm:w-[400px]
                       flex items-center gap-3 rounded-2xl bg-(--p-banda) text-white px-4 py-3.5 shadow-2xl shadow-black/25"
          >
            <span className="grid place-items-center shrink-0 size-8 rounded-full bg-(--p-acento) text-[#170f27]"><I.Check tam={17} /></span>
            <span className="flex-1 min-w-0 text-[14px] font-medium leading-snug">{aviso}</span>
            <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso"
              className="grid place-items-center shrink-0 size-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
              <I.Cerrar tam={16} />
            </button>
          </div>
        </Capa>
      )}

      {/* Lista */}
      <section className="aparecer [--i:2] mt-5 flex flex-col rounded-[20px] bg-(--p-sup) border border-(--p-borde) overflow-hidden transition-colors">
        <header className="flex items-center gap-3 h-12 pl-5 pr-2 bg-(--p-banda) text-white">
          <span className="text-(--p-acento)"><I.Estudiantes tam={17} /></span>
          <h2 className="flex-1 text-[12.5px] font-bold tracking-[0.14em] uppercase">Lista de estudiantes</h2>
          <div className="flex items-center gap-1 p-1 rounded-[12px] bg-white/10" role="group" aria-label="Vista">
            <BotonVista activo={vista === 'lista'} etiqueta="Ver como lista" onClick={() => setVista('lista')}><I.Lista tam={16} /></BotonVista>
            <BotonVista activo={vista === 'tarjetas'} etiqueta="Ver como tarjetas" onClick={() => setVista('tarjetas')}><I.Grilla tam={15} /></BotonVista>
          </div>
        </header>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2.5 lg:gap-3 p-3 min-[400px]:p-4 border-b border-(--p-borde)">
          <label className="flex-1 min-w-0 lg:min-w-[240px] flex items-center gap-3 h-11 px-4 rounded-xl border border-(--p-borde) focus-within:border-(--p-acento) transition-colors">
            <span className="text-(--p-suave)"><I.Buscar tam={17} /></span>
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Nombre o identidad"
              aria-label="Buscar por nombre o número de identidad"
              className="flex-1 min-w-0 bg-transparent text-[14px] outline-none placeholder:text-(--p-suave)"
            />
          </label>
          {/* Celular y tablet: los filtros van en un panel aparte */}
          <button
            type="button"
            onClick={() => setFiltrosAbiertos(true)}
            className="lg:hidden flex items-center gap-2 h-11 px-4 rounded-xl bg-(--p-banda) text-white text-[13.5px] font-bold hover:brightness-125"
          >
            <span className="text-(--p-acento)"><I.Filtros tam={17} /></span>
            Filtros
            {filtrosActivos > 0 && (
              <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-(--p-acento) text-[#170f27] text-[11px] font-bold">
                {filtrosActivos}
              </span>
            )}
          </button>
          <div className="hidden lg:contents">{filtros('w-[210px]')}</div>
        </div>

        {!estudiantes && !cargando ? (
          <p className="px-5 py-8 text-[14px] text-(--p-suave)">No hay datos.</p>
        ) : estudiantes && filas.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[15px] font-semibold">No hay estudiantes que coincidan</p>
            <p className="mt-1 text-[13px] text-(--p-suave)">Prueba con otro nombre o quita algún filtro.</p>
          </div>
        ) : vista === 'lista' ? (
          <>
          <div className="hidden lg:block">
            {/* table-fixed + colgroup: los anchos no dependen del contenido, así no se reacomoda al cargar */}
            <table className="w-full table-fixed text-left">
              <colgroup>
                {/* Estudiante no tiene ancho: se queda con el espacio que sobre */}
                <col />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />{/* Tipo de sangre: valores cortos (O+, AB-) */}
                <col className="w-[188px]" />
              </colgroup>
              <thead className="bg-(--p-menta)/60">
                <tr className="text-[10.5px] tracking-[0.16em] text-(--p-suave) uppercase">
                  <th className="pl-5 py-3 font-semibold">Estudiante</th>
                  <th className="py-3 font-semibold">Grado</th>
                  <th className="py-3 font-semibold">Jornada</th>
                  <th className="py-3 font-semibold">Año</th>
                  <th className="py-3 font-semibold">Nacimiento</th>
                  <th className="py-3 font-semibold">Estado</th>
                  <th className="py-3 font-semibold">Tipo de sangre</th>
                  <th className="pr-5 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {!estudiantes && Array.from({ length: FILAS_ESQUELETO }, (_, i) => <FilaEsqueleto key={i} />)}
                {estudiantes && filas.map(({ e, m, otrosYears }, i) => (
                  <tr key={e.numero_identidad} className="aparecer-fila border-t border-(--p-borde) hover:bg-(--p-hover)/60" style={{ '--i': Math.min(i, 12) } as CSSProperties}>
                    <td className="pl-5 py-2.5">
                      <button type="button" onClick={() => abrirFicha(e.numero_identidad)} className="flex items-center gap-3 min-w-0 text-left">
                        <Avatar nombre={e.nombre} destacado={i === 0} />
                        <span className="min-w-0 leading-tight">
                          <span className="block text-[14px] font-semibold truncate hover:underline">{e.nombre}</span>
                          <span className="block text-[12px] text-(--p-suave) truncate">Doc. {documento(e.numero_identidad)}</span>
                        </span>
                      </button>
                    </td>
                    <td className="py-2.5 text-[13.5px]">{m?.grado?.nombre ?? '—'}</td>
                    <td className="py-2.5">{m ? <ChipJornada jornada={m.jornada} /> : '—'}</td>
                    <td className="py-2.5 leading-tight">
                      <span className="block text-[13.5px]">{m?.year ?? '—'}</span>
                      {otrosYears.length > 0 && <span className="block text-[11.5px] text-(--p-suave)">también {otrosYears.join(', ')}</span>}
                    </td>
                    <td className="py-2.5 text-[13.5px] whitespace-nowrap">{fechaDia(e.fecha_nacimiento)}</td>
                    <td className="py-2.5">{m ? <ChipEstado estado={m.estado} /> : '—'}</td>
                    <td className="py-2.5 text-[13.5px] whitespace-nowrap">{e.rh || <span className="text-(--p-tenue)">—</span>}</td>
                    <td className="pr-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <BotonAccion etiqueta="Editar datos" onClick={() => setEditando(e)}><I.Lapiz tam={16} /></BotonAccion>
                        <BotonAccion etiqueta="Ver ficha" onClick={() => abrirFicha(e.numero_identidad)}><I.ChevronDerecha tam={16} /></BotonAccion>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular y tablet: lista compacta; al tocar una fila se abre la ficha */}
          <ul className="lg:hidden">
            {!estudiantes && Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 h-[64px] border-b last:border-b-0 border-(--p-borde)" aria-hidden>
                <span className="size-10 shrink-0 rounded-full esqueleto" />
                <span className="flex-1 space-y-1.5"><span className="block h-3 w-3/5 rounded-full esqueleto" /><span className="block h-3 w-2/5 rounded-full esqueleto" /></span>
              </li>
            ))}
            {estudiantes && filas.map(({ e, m }, i) => (
              <li key={e.numero_identidad} className="aparecer-fila border-b last:border-b-0 border-(--p-borde)" style={{ '--i': Math.min(i, 12) } as CSSProperties}>
                <button
                  type="button"
                  onClick={() => abrirFicha(e.numero_identidad)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-(--p-hover)"
                >
                  <Avatar nombre={e.nombre} destacado={i === 0} tam="size-10" />
                  <span className="flex-1 min-w-0 leading-tight">
                    <span className="block text-[14.5px] font-semibold truncate">{e.nombre}</span>
                    <span className="block mt-0.5 text-[12px] text-(--p-suave) truncate">
                      {m ? `${m.grado?.nombre ?? 'Sin grado'} · ${capitalizar(m.jornada)}` : documentoCompleto(e)}
                    </span>
                  </span>
                  {m && <ChipEstado estado={m.estado} />}
                  <span className="text-(--p-suave)"><I.ChevronDerecha tam={16} /></span>
                </button>
              </li>
            ))}
          </ul>
          </>
        ) : !estudiantes ? (
          <ul className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-4 sm:p-4">
            {Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
              <li key={i} className="h-[300px] max-sm:border-b border-(--p-borde) sm:rounded-[18px] sm:border p-4" aria-hidden>
                <div className="h-full rounded-2xl esqueleto" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-4 sm:p-4">
            {filas.map(({ e, m, otrosYears }, i) => (
              <TarjetaEstudiante
                key={e.numero_identidad}
                indice={i}
                e={e}
                m={m}
                otrosYears={otrosYears}
                onFicha={() => abrirFicha(e.numero_identidad)}
                onEditar={() => setEditando(e)}
              />
            ))}
          </ul>
        )}
      </section>

      {filtrosAbiertos && (
        <PanelFiltros
          activos={filtrosActivos}
          resultados={filas.length}
          onLimpiar={limpiarFiltros}
          onCerrar={() => setFiltrosAbiertos(false)}
        >
          {filtros('w-full')}
        </PanelFiltros>
      )}

      {ficha && (
        <FichaEstudiante
          key={ficha.id}
          id={ficha.id}
          pestanaInicial={ficha.pestana}
          version={versionFicha}
          onEditar={setEditando}
          onCerrar={() => setFicha(null)}
          onCambiarEstado={(e, m) => setCambioEstado({ e, m })}
          onIr={onIr}
        />
      )}

      {editando && (
        <DialogoEditarEstudiante
          estudiante={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={msg => { setEditando(null); setAviso(msg); setVersionFicha(v => v + 1); recargar(); }}
        />
      )}

      {cambioEstado && (
        <DialogoEstado
          estudiante={cambioEstado.e}
          promocion={cambioEstado.e.matriculas.find(x => x.year === cambioEstado.m.year + 1 &&
            x.estado === (cambioEstado.m.estado === 'RETIRADO' ? 'RETIRADO' : 'PROMOCION'))}
          matricula={cambioEstado.m}
          onCerrar={() => setCambioEstado(null)}
          onListo={msg => { setCambioEstado(null); setAviso(msg); setVersionFicha(v => v + 1); recargar(); }}
        />
      )}
    </main>
  );
}

/** Un grado por nombre y jornada, en el orden en que vienen. */
function gradosUnicos(grados: Grado[]) {
  return [...grados].sort((a, b) => a.id_grado - b.id_grado);
}

/* ── Piezas pequeñas ───────────────────────────────────────────── */

/** Fila gris del mismo alto que una real, mientras cargan los datos. */
function FilaEsqueleto() {
  const barra = (ancho: string) => <span className={`block h-3 rounded-full esqueleto ${ancho}`} />;
  return (
    <tr className="border-t border-(--p-borde)" aria-hidden>
      <td className="pl-5 py-2.5">
        <div className="flex items-center gap-3">
          <span className="size-9 shrink-0 rounded-full esqueleto" />
          <span className="flex-1 space-y-1.5">{barra('w-3/5')}{barra('w-2/5')}</span>
        </div>
      </td>
      {['w-2/3', 'w-1/2', 'w-1/2', 'w-2/3', 'w-1/2', 'w-2/3'].map((a, i) => <td key={i} className="py-2.5 pr-4">{barra(a)}</td>)}
      <td className="pr-5 py-2.5"><div className="h-9 w-[168px] rounded-[10px] esqueleto" /></td>
    </tr>
  );
}

function Indicador({
  Icono, cuadro, titulo, insignia, valor, pct, oscuro = false, clave,
}: {
  Icono: ComponentType<{ tam?: number }>;
  cuadro: string;
  titulo: string;
  insignia: string;
  valor: number | string;
  pct: number;
  oscuro?: boolean;
  clave: string;
}) {
  return (
    <div
      className="min-w-0 px-3 min-[400px]:px-3.5 pt-3.5 pb-4 lg:px-[22px] lg:pt-5 lg:pb-[22px]
                 max-lg:rounded-[20px] max-lg:bg-(--p-sup) max-lg:border max-lg:border-(--p-borde) transition-colors"
    >
      <div className="flex items-center gap-1.5 min-[420px]:gap-2 lg:gap-3">
        <span className={`grid place-items-center shrink-0 size-6 min-[420px]:size-7 lg:size-9 rounded-lg lg:rounded-[10px] [&>svg]:size-[15px] lg:[&>svg]:size-[18px] ${cuadro}`}><Icono tam={18} /></span>
        <p className="flex-1 min-w-0 text-[9px] min-[420px]:text-[9.5px] lg:text-[11.5px] font-semibold tracking-[0.06em] min-[420px]:tracking-[0.12em] lg:tracking-[0.16em] uppercase text-(--p-suave) truncate">{titulo}</p>
        <span className="shrink-0 h-5 lg:h-6 px-1.5 min-[420px]:px-2 lg:px-2.5 flex items-center rounded-full bg-(--p-menta) text-[10.5px] lg:text-[12px] font-bold">{insignia}</span>
      </div>
      <p className="mt-2.5 lg:mt-3 text-[24px] lg:text-[31px] leading-none font-extrabold tracking-tight">{valor}</p>
      <div className="mt-3.5 lg:mt-4">
        {pct > 0 ? (
          <Progreso
            key={clave}
            valor={pct}
            relleno={oscuro ? 'bg-(--p-linea)' : 'bg-(--p-acento)'}
            borde={oscuro ? 'border-(--p-linea)' : 'border-(--p-acento)'}
          />
        ) : (
          <div className="h-[5px] rounded-full bg-(--p-menta)" />
        )}
      </div>
    </div>
  );
}

function Avatar({ nombre, destacado = false, tam = 'size-9' }: { nombre: string; destacado?: boolean; tam?: string }) {
  return (
    <span className={`grid place-items-center shrink-0 ${tam} rounded-full text-[12px] font-bold ${destacado ? 'bg-(--p-acento) text-[#170f27]' : 'bg-(--p-menta)'}`}>
      {iniciales(nombre)}
    </span>
  );
}

/** Etiqueta de jornada. En claro: tinte dorado (Mañana) o gris (Tarde). En oscuro: fondo
 *  violeta elevado y el color solo en el ícono (sol dorado, atardecer gris ceniza). */
function ChipJornada({ jornada, sobreMenta = false }: { jornada: 'MAÑANA' | 'TARDE'; sobreMenta?: boolean }) {
  const manana = jornada === 'MAÑANA';
  return (
    <span className={`chip-jornada ${manana ? 'manana' : 'tarde'} ${sobreMenta ? 'sobre-menta' : ''} inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[9px] text-[12px] font-bold`}>
      <span className="icono inline-flex">{manana ? <I.SolRayos tam={13} /> : <I.Atardecer tam={13} />}</span>
      {manana ? 'Mañana' : 'Tarde'}
    </span>
  );
}

function ChipEstado({ estado, tam = 'text-[12px]' }: { estado: Estado; tam?: string }) {
  const estilos: Record<Estado, string> = {
    ACTIVO: 'bg-(--p-acento) text-[#170f27]',
    RETIRADO: 'bg-(--p-menta) text-(--p-suave)',
    PROMOCION: 'bg-(--p-icono) text-(--p-acento)',
    FINALIZADO: 'bg-(--p-icono) text-(--p-icono-txt)',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full ${tam} font-bold ${estilos[estado]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {NOMBRE_ESTADO[estado]}
    </span>
  );
}

function BotonAccion({ etiqueta, onClick, children }: { etiqueta: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="grid place-items-center size-9 rounded-[10px] border border-(--p-borde) hover:bg-(--p-hover)"
    >
      {children}
    </button>
  );
}

/* ── Tarjeta del estudiante (vista Tarjetas) ───────────────────────
   Diseño: docs/Estudiantes móvil · Modo claro@1x.png y -oscuro. */

function TarjetaEstudiante({
  indice, e, m, otrosYears, onFicha, onEditar,
}: {
  indice: number;
  e: EstudianteListItem;
  m: MatriculaListItem | null;
  otrosYears: number[];
  onFicha: () => void;
  onEditar: () => void;
}) {
  return (
    <li
      className="aparecer-fila min-w-0 p-4 min-[400px]:p-5 max-sm:border-b max-sm:last:border-b-0 border-(--p-borde) sm:rounded-[18px] sm:border"
      style={{ '--i': Math.min(indice, 12) } as CSSProperties}
    >
      <div className="flex items-start gap-3">
        <button type="button" onClick={onFicha} className="flex flex-1 min-w-0 items-center gap-3 text-left" aria-label={`Ver ficha de ${e.nombre}`}>
          <Avatar nombre={e.nombre} destacado={indice === 0} tam="size-11" />
          <span className="min-w-0 leading-tight">
            <span className="block text-[16px] font-bold truncate">{e.nombre}</span>
            <span className="block mt-0.5 text-[12.5px] text-(--p-suave) truncate">{documentoCompleto(e)}</span>
          </span>
        </button>
        {m && <span className="shrink-0 mt-1"><ChipEstado estado={m.estado} /></span>}
      </div>

      <div className="mt-3.5 rounded-2xl bg-(--p-menta) px-3.5 py-3">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          <DatoTarjeta etiqueta="Grado">{m?.grado?.nombre ?? '—'}</DatoTarjeta>
          <DatoTarjeta etiqueta="Jornada">{m ? <ChipJornada jornada={m.jornada} sobreMenta /> : '—'}</DatoTarjeta>
          <DatoTarjeta etiqueta="Año" ajustar>
            {m ? <>{m.year}{otrosYears.length > 0 && <span className="font-medium text-(--p-suave)"> · también {otrosYears.join(', ')}</span>}</> : '—'}
          </DatoTarjeta>
          <DatoTarjeta etiqueta="Nacimiento">{fechaDia(e.fecha_nacimiento)}</DatoTarjeta>
        </dl>
        {m?.fecha_matricula && (
          <p className="mt-2.5 flex items-center gap-2 text-[12.5px] text-(--p-suave)">
            <I.Calendario tam={14} /> Matriculado el <b className="text-(--p-tinta)">{fechaDia(m.fecha_matricula)}</b>
          </p>
        )}
      </div>

      {/* Matricular, retirar y acudientes están dentro de la ficha */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <AccionTarjeta etiqueta="Editar" onClick={onEditar}><I.Lapiz tam={16} /></AccionTarjeta>
        <AccionTarjeta etiqueta="Ver ficha" onClick={onFicha} alFinal><I.ChevronDerecha tam={16} /></AccionTarjeta>
      </div>
    </li>
  );
}

function DatoTarjeta({ etiqueta, ajustar = false, children }: { etiqueta: string; ajustar?: boolean; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">{etiqueta}</dt>
      <dd className={`mt-0.5 text-[14px] font-bold ${ajustar ? 'leading-snug' : 'truncate'}`}>{children}</dd>
    </div>
  );
}

function AccionTarjeta({
  etiqueta, onClick, alFinal = false, children,
}: { etiqueta: string; onClick: () => void; /** Ícono después del texto (p. ej. la flecha de «Ver ficha»). */ alFinal?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="presionable min-w-0 flex items-center justify-center gap-2 h-11 rounded-xl border border-(--p-borde) bg-(--p-sup)
                 text-[13.5px] font-semibold hover:bg-(--p-hover)"
    >
      {!alFinal && children}
      <span className="truncate">{etiqueta}</span>
      {alFinal && children}
    </button>
  );
}

/* ── Panel de filtros (celular y tablet) ───────────────────────── */

function PanelFiltros({
  activos, resultados, onLimpiar, onCerrar, children,
}: { activos: number; resultados: number; onLimpiar: () => void; onCerrar: () => void; children: ReactNode }) {
  useEscape(onCerrar);
  return (
    <Capa>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
        <div className="velo absolute inset-0 bg-black/45" onClick={onCerrar} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          style={zoomCapa}
          className="hoja relative w-full sm:max-w-[440px] rounded-t-[24px] sm:rounded-[24px] bg-(--p-sup) text-(--p-tinta) shadow-2xl overflow-hidden
                     pb-[env(safe-area-inset-bottom)]"
        >
          <header className="flex items-center gap-3 h-14 pl-5 pr-3 bg-(--p-banda) text-white">
            <span className="text-(--p-acento)"><I.Filtros tam={18} /></span>
            <h2 className="flex-1 text-[12.5px] font-bold tracking-[0.14em] uppercase">Filtros</h2>
            <button type="button" onClick={onCerrar} aria-label="Cerrar filtros"
              className="grid place-items-center size-9 rounded-xl bg-white/10 hover:bg-white/20">
              <I.Cerrar tam={17} />
            </button>
          </header>
          <div className="flex flex-col gap-3 p-4">{children}</div>
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            <button type="button" onClick={onLimpiar} disabled={!activos}
              className="h-12 rounded-xl border border-(--p-borde) text-[14px] font-bold hover:bg-(--p-hover) disabled:opacity-45">
              Limpiar
            </button>
            <button type="button" onClick={onCerrar}
              className="h-12 rounded-xl bg-(--p-acento) text-[#170f27] text-[12.5px] font-bold tracking-[0.12em] hover:brightness-105">
              VER {resultados} {resultados === 1 ? 'ESTUDIANTE' : 'ESTUDIANTES'}
            </button>
          </div>
        </div>
      </div>
    </Capa>
  );
}

function BotonVista({ activo, etiqueta, onClick, children }: { activo: boolean; etiqueta: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-pressed={activo}
      title={etiqueta}
      className={`grid place-items-center size-8 rounded-[9px] ${activo ? 'bg-(--p-acento) text-[#170f27]' : 'text-white/70 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

function Filtro({
  Icono, etiqueta, valor, onCambio, opciones, ancho = 'w-[210px]',
}: {
  ancho?: string;
  Icono: ComponentType<{ tam?: number }>;
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  opciones: [string, string][];
}) {
  return (
    <label className={`relative flex items-center ${ancho} h-11 rounded-xl border border-(--p-borde) focus-within:border-(--p-acento) transition-colors`}>
      <span className="pointer-events-none absolute left-3.5 text-(--p-suave)"><Icono tam={16} /></span>
      <select
        value={valor}
        onChange={e => onCambio(e.target.value)}
        aria-label={etiqueta}
        className="appearance-none w-full h-full bg-transparent pl-10 pr-9 text-[13.5px] font-semibold outline-none cursor-pointer truncate"
      >
        {opciones.map(([v, t]) => <option key={v} value={v} className="bg-(--p-sup)">{t}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3"><I.ChevronAbajo tam={15} /></span>
    </label>
  );
}

/* ── Capa: ficha lateral y diálogos (fuera del zoom) ───────────── */

function Capa({ children }: { children: ReactNode }) {
  const destino = document.getElementById(ID_CAPA);
  return destino ? createPortal(children, destino) : null;
}

function useEscape(onCerrar: () => void) {
  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alTecla);
    return () => document.removeEventListener('keydown', alTecla);
  }, [onCerrar]);
}

/** Mismo tamaño que el resto del contenido. */
const zoomCapa: CSSProperties = { zoom: ESCALA_CONTENIDO };

function Dialogo({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: ReactNode }) {
  useEscape(onCerrar);
  return (
    <Capa>
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className="velo absolute inset-0 bg-black/40" onClick={onCerrar} />
        <div role="dialog" aria-modal="true" aria-label={titulo} style={zoomCapa}
          className="dialogo relative w-full max-w-[460px] rounded-[20px] bg-(--p-sup) text-(--p-tinta) border border-(--p-borde) shadow-2xl overflow-hidden">
          <header className="flex items-center gap-3 h-12 pl-5 pr-2 bg-(--p-banda) text-white">
            <h2 className="flex-1 text-[12.5px] font-bold tracking-[0.14em] uppercase">{titulo}</h2>
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid place-items-center size-8 text-white/70 hover:text-white"><I.Cerrar tam={17} /></button>
          </header>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </Capa>
  );
}

function BotonesDialogo({ onCancelar, texto, enviando, peligro = false }: { onCancelar: () => void; texto: string; enviando: boolean; peligro?: boolean }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button type="button" onClick={onCancelar} className="h-10 px-4 rounded-xl border border-(--p-borde) text-[13.5px] font-semibold hover:bg-(--p-hover)">
        Cancelar
      </button>
      <button
        type="submit"
        disabled={enviando}
        className={`h-10 px-5 rounded-xl text-[12.5px] font-bold tracking-[0.12em] uppercase disabled:opacity-60 ${
          peligro ? 'bg-(--p-banda) text-white' : 'bg-(--p-acento) text-[#170f27]'
        }`}
      >
        {enviando ? 'Guardando…' : texto}
      </button>
    </div>
  );
}

function ErrorFormulario({ texto }: { texto: string }) {
  return texto ? <p role="alert" className="mt-4 text-[13.5px] font-medium text-red-600">{texto}</p> : null;
}

function DialogoEstado({
  estudiante, matricula, promocion, onCerrar, onListo,
}: {
  estudiante: { nombre: string }; matricula: MatriculaListItem;
  /** Su matrícula del año siguiente: en promoción (al retirar) o retirada con ella (al reactivar). */
  promocion?: MatriculaListItem;
  onCerrar: () => void; onListo: (msg: string) => void;
}) {
  const retirar = matricula.estado === 'ACTIVO' || matricula.estado === 'PROMOCION';
  const conOpcionPromocion = !!promocion && matricula.estado !== 'PROMOCION';
  // Si se va del colegio, lo normal es que tampoco siga el próximo año (y si vuelve, que sí siga).
  const [conPromocion, setConPromocion] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const r = await matriculasApi.cambiarEstado(matricula.id_matricula, retirar ? 'RETIRADO' : 'ACTIVO', conOpcionPromocion && conPromocion);
      onListo(retirar
        ? `${estudiante.nombre} fue retirado${r.promocionRetirada ? ` (también de ${r.promocionRetirada})` : ''}.${r.cuentasEliminadas ? ` Se quitaron ${r.cuentasEliminadas} cobros futuros sin pagos.` : ''}`
        : `${estudiante.nombre} fue reactivado${r.promocionReactivada ? ` (también en ${r.promocionReactivada})` : ''}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.');
      setEnviando(false);
    }
  }

  return (
    <Dialogo titulo={retirar ? 'Retirar estudiante' : 'Reactivar estudiante'} onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        <p className="text-[14px]">
          {retirar ? '¿Retirar a ' : '¿Reactivar a '}<b>{estudiante.nombre}</b> de {matricula.grado?.nombre ?? 'su grado'} en {matricula.year}?
        </p>
        <p className="mt-2 text-[12.5px] text-(--p-suave)">
          {retirar
            ? 'Se borran las pensiones de los meses que vienen y que no tienen pagos. Lo ya pagado no se toca.'
            : 'Las pensiones que falten se pueden volver a generar desde Pagos.'}
        </p>
        {conOpcionPromocion && (
          <label className="mt-4 flex items-start gap-2.5 text-[13.5px] cursor-pointer">
            <input type="checkbox" checked={conPromocion} onChange={e => setConPromocion(e.target.checked)}
              className="mt-0.5 size-4 accent-(--p-acento) cursor-pointer" />
            <span>
              {retirar ? 'Retirar' : 'Reactivar'} también su matrícula de <b>{promocion.year}</b>{promocion.grado ? ` en ${promocion.grado.nombre}` : ''}.
              <span className="block text-[12.5px] text-(--p-suave)">{retirar ? `Si no la retiras, el 1 de enero quedará activo en ${promocion.year}.` : `Vuelve a quedar en promoción para ${promocion.year}.`}</span>
            </span>
          </label>
        )}
        <ErrorFormulario texto={error} />
        <BotonesDialogo onCancelar={onCerrar} texto={retirar ? 'Retirar' : 'Reactivar'} enviando={enviando} peligro={retirar} />
      </form>
    </Dialogo>
  );
}

/* ── Ficha del estudiante ──────────────────────────────────────────
   Diseño: docs/Ficha del estudiante (panel lateral) · Modo claro@1x.png y -oscuro.
   Se quitaron los íconos de cada dato y de las cajas de la matrícula:
   la etiqueta ya dice qué es y así la ficha se lee más limpia. */

/** Alto (sin zoom) de la ficha completa en la pestaña Datos: encabezado + contenido + botones. */
const ALTO_FICHA = 1030;
/** Hueco arriba y abajo del panel flotante en computador (lg:p-4). */
const HUECO_FICHA = 32;

/**
 * Zoom de la ficha. En computador se achica según el alto de la ventana para que
 * todo quepa sin desplazarse, como en la referencia (nunca más que el resto del
 * panel, 0,85, ni menos de 0,7 para que se siga leyendo). En celular, el normal.
 */
function useZoomFicha() {
  const calcular = () => {
    if (!window.matchMedia("(min-width: 64rem)").matches) return null;
    return Math.min(0.85, Math.max(0.7, (window.innerHeight - HUECO_FICHA) / ALTO_FICHA));
  };
  const [zoom, setZoom] = useState(calcular);
  useEffect(() => {
    const alCambiar = () => setZoom(calcular());
    window.addEventListener("resize", alCambiar);
    return () => window.removeEventListener("resize", alCambiar);
  }, []);
  return zoom;
}

/** Lo que dura la salida del panel (más corta que la entrada, como pide el CSS). */
const SALIDA_FICHA_MS = 220;

function FichaEstudiante({
  id, pestanaInicial, version, onEditar, onCerrar, onCambiarEstado, onIr,
}: {
  id: string;
  pestanaInicial: PestanaFicha;
  /** Cambia cuando se guardan datos desde fuera (modal de edición). */
  version: number;
  onEditar: (e: EstudianteListItem) => void;
  onCerrar: () => void;
  onCambiarEstado: (e: EstudianteListItem, m: MatriculaListItem) => void;
  onIr: (s: Seccion) => void;
}) {
  const [detalle, setDetalle] = useState<EstudianteDetalle | null>(null);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState<PestanaFicha>(pestanaInicial);
  const [saliendo, setSaliendo] = useState(false);
  const cerrado = useRef(false);
  const zoom = useZoomFicha();

  // Salida: el panel se desliza a la derecha y el velo se desvanece; al terminar se desmonta.
  const cerrar = useCallback(() => {
    if (cerrado.current) return;
    cerrado.current = true;
    setSaliendo(true);
    window.setTimeout(onCerrar, SALIDA_FICHA_MS);
  }, [onCerrar]);

  // Escape cierra la ficha solo si no hay un modal abierto encima (ese se cierra primero).
  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelectorAll(`#${ID_CAPA} [aria-modal="true"]`).length > 1) return;
      cerrar();
    };
    document.addEventListener('keydown', alTecla);
    return () => document.removeEventListener('keydown', alTecla);
  }, [cerrar]);

  useEffect(() => {
    let vigente = true;
    estudiantesApi.obtener(id)
      .then(d => { if (vigente) { setDetalle(d); setError(''); } })
      .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo cargar la ficha.'); });
    return () => { vigente = false; };
  }, [id, version]);

  const pestanas: [PestanaFicha, string][] = [['datos', 'Datos'], ['acudientes', 'Acudientes'], ['matriculas', 'Matrículas'], ['pagos', 'Pagos']];
  const actual = detalle ? matriculaActual(detalle.matriculas) : undefined;
  // Un año que ya terminó (FINALIZADO) no se retira ni se reactiva.
  const puedeCambiarEstado = !!actual && actual.estado !== 'FINALIZADO' && actual.year >= YEAR_ACTUAL;

  return (
    <Capa>
      <div className="fixed inset-0 z-40 flex justify-end lg:p-4">
        <div className={`velo absolute inset-0 bg-black/35 ${saliendo ? 'saliendo' : ''}`} onClick={cerrar} />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Ficha del estudiante"
          style={zoom === null
            ? { ...zoomCapa, height: `calc(100dvh / ${ESCALA_CONTENIDO})` }
            : { zoom, height: `calc((100dvh - ${HUECO_FICHA}px) / ${zoom})` }}
          className={`cajon ${saliendo ? 'saliendo' : ''} relative w-full max-w-[600px] flex flex-col overflow-hidden bg-(--p-sup) text-(--p-tinta) shadow-2xl lg:rounded-[24px]`}
        >
          <header className="shrink-0 bg-(--p-banda) text-white px-5 sm:px-6 py-5">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {detalle ? <Avatar nombre={detalle.nombre} destacado tam="size-12 sm:size-14 text-[16px]! sm:text-[18px]!" /> : <span className="size-12 sm:size-14" />}
              <h2 className="flex-1 min-w-0 text-[19px] sm:text-[22px] font-extrabold leading-tight truncate">{detalle?.nombre ?? 'Cargando…'}</h2>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar ficha"
                className="presionable grid place-items-center size-10 rounded-[12px] bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
              >
                <I.Cerrar tam={18} />
              </button>
            </div>
          </header>

          {/* El espacio de la barra queda reservado siempre: así el contenido no cambia
              de ancho al pasar de una pestaña corta a una larga. */}
          <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] [scrollbar-width:thin] pl-4 pr-2 sm:pl-6 sm:pr-4 pt-5 pb-4">
            {error ? (
              <p role="alert" className="text-[14.7px] text-red-600">{error}</p>
            ) : !detalle ? (
              <FichaEsqueleto />
            ) : (
              <>
                <MatriculaActual matriculas={detalle.matriculas} actual={actual} />

                <nav role="tablist" aria-label="Secciones de la ficha" className="mt-4 grid grid-cols-4 gap-1 p-1 rounded-[14px] bg-(--p-menta)">
                  {pestanas.map(([p, t]) => (
                    <button
                      key={p}
                      type="button"
                      role="tab"
                      aria-selected={pestana === p}
                      onClick={() => setPestana(p)}
                      className={`h-10 sm:h-11 rounded-[11px] text-[13.13px] min-[400px]:text-[14.18px] font-semibold transition-colors ${
                        pestana === p ? 'bg-(--p-acento) text-[#170f27] font-bold shadow-sm' : 'text-(--p-suave) hover:text-(--p-tinta)'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </nav>

                <div key={pestana} className="fundido mt-4">
                  {pestana === 'datos' && <PestanaDatos detalle={detalle} />}
                  {pestana === 'acudientes' && <PestanaAcudientes detalle={detalle} />}
                  {pestana === 'matriculas' && (
                    <PestanaMatriculas detalle={detalle} idActual={actual?.id_matricula} />
                  )}
                  {pestana === 'pagos' && <PestanaPagos detalle={detalle} onIr={onIr} />}
                </div>
              </>
            )}
          </div>

          {detalle && (
            <footer className="shrink-0 flex gap-2.5 sm:gap-3 px-4 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-(--p-borde)">
              {puedeCambiarEstado && (
                <BotonFicha
                  estilo="borde"
                  onClick={() => onCambiarEstado(detalle, actual)}
                  Icono={actual.estado === 'RETIRADO' ? I.PersonaMas : I.PersonaMenos}
                >
                  {actual.estado === 'RETIRADO' ? 'Reactivar' : 'Retirar'}
                </BotonFicha>
              )}
              {/* La ficha es para consultar: matricular (o rematricular) se hace en la sección Matrículas. */}
              <BotonFicha estilo="acento" onClick={() => onEditar(detalle)} Icono={I.Lapiz}>
                Editar
              </BotonFicha>
            </footer>
          )}
        </aside>
      </div>
    </Capa>
  );
}

/** La matrícula del año en curso; si no hay, la más reciente. */
function matriculaActual(matriculas: MatriculaListItem[]) {
  return matriculas.find(m => m.year === YEAR_ACTUAL) ?? [...matriculas].sort((a, b) => b.year - a.year)[0];
}

function BotonFicha({
  estilo, onClick, Icono, children,
}: {
  estilo: 'borde' | 'oscuro' | 'acento';
  onClick: () => void;
  Icono: ComponentType<{ tam?: number }>;
  children: ReactNode;
}) {
  const estilos = {
    borde: 'shrink-0 px-3.5 sm:px-4 border border-(--p-borde) hover:bg-(--p-hover)',
    oscuro: 'flex-1 bg-(--p-boton-2) text-(--p-boton-2-txt) hover:brightness-110',
    acento: 'flex-1 bg-(--p-acento) text-[#170f27] hover:brightness-105',
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`presionable flex items-center justify-center gap-2 h-12 rounded-[12px] text-[12.6px] min-[400px]:text-[13.13px] font-bold tracking-[0.1em] uppercase ${estilos[estilo]}`}
    >
      {/* En pantallas muy angostas solo el texto, para que quepan los tres botones */}
      <span className="hidden min-[420px]:inline-flex"><Icono tam={16} /></span>
      {children}
    </button>
  );
}

function MatriculaActual({ matriculas, actual }: { matriculas: MatriculaListItem[]; actual: MatriculaListItem | undefined }) {
  if (!actual) {
    return (
      <section className="rounded-[18px] bg-(--p-menta) p-4 sm:p-5">
        <h3 className="text-[12.6px] font-bold tracking-[0.14em] uppercase">Matrícula actual</h3>
        <p className="mt-2 text-[14.7px] text-(--p-suave)">Este estudiante todavía no tiene matrícula. Se matricula desde la sección Matrículas.</p>
      </section>
    );
  }
  const posteriores = matriculas.filter(m => m.year > actual.year).map(m => m.year).sort();
  return (
    <section className="rounded-[18px] bg-(--p-menta) p-3 sm:p-4">
      <div className="flex items-center gap-2.5 px-1 pb-3">
        <span className="grid place-items-center size-8 rounded-[10px] bg-(--p-acento) text-[#170f27]"><I.Birrete tam={17} /></span>
        <h3 className="flex-1 text-[12.6px] sm:text-[13.13px] font-bold tracking-[0.14em] uppercase">Matrícula actual</h3>
        <ChipEstado estado={actual.estado} tam="text-[12.6px]" />
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:gap-2.5">
        <CajaMatricula etiqueta="Grado" valor={actual.grado?.nombre ?? '—'} />
        <CajaMatricula etiqueta="Jornada" valor={capitalizar(actual.jornada)} />
        <CajaMatricula
          etiqueta="Año"
          valor={String(actual.year)}
          nota={posteriores.length ? `También tiene matrícula en ${posteriores.join(', ')}` : undefined}
        />
        <CajaMatricula etiqueta="Matriculado el" valor={fechaDia(actual.fecha_matricula)} />
      </dl>
    </section>
  );
}

function CajaMatricula({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-[12px] bg-(--p-sup) px-3.5 py-2.5 min-w-0">
      <dt className="text-[11.03px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">{etiqueta}</dt>
      <dd className="mt-1 text-[15.75px] sm:text-[16.8px] font-bold truncate">{valor}</dd>
      {nota && <p className="mt-0.5 text-[12.08px] text-(--p-suave) leading-snug">{nota}</p>}
    </div>
  );
}

function FichaEsqueleto() {
  return (
    <div aria-hidden>
      <div className="esqueleto h-[188px] rounded-[18px]" />
      <div className="esqueleto mt-5 h-12 rounded-[14px]" />
      {[0, 1, 2, 3].map(i => <div key={i} className="esqueleto mt-4 h-12 rounded-[10px]" />)}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

function Bloque({ titulo, accion, children }: { titulo: ReactNode; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="text-[16.28px] font-bold">{titulo}</h3>
        {accion}
      </div>
      {children}
    </section>
  );
}

/** Fila de dato: etiqueta pequeña arriba y valor debajo, con una línea divisoria. */
function Dato({ etiqueta, valor, accion }: { etiqueta: string; valor: ReactNode; accion?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 border-t border-(--p-borde) min-w-0">
      <div className="flex-1 min-w-0">
        <dt className="text-[11.03px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">{etiqueta}</dt>
        <dd className="mt-1 text-[15.75px] font-semibold break-words">{valor || <span className="font-normal text-(--p-tenue)">Sin dato</span>}</dd>
      </div>
      {accion}
    </div>
  );
}

function BotonCopiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1500);
    } catch { /* sin permiso del portapapeles: no pasa nada */ }
  }
  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={copiado ? 'Copiado' : etiqueta}
      title={copiado ? 'Copiado' : etiqueta}
      className="presionable grid place-items-center size-9 shrink-0 rounded-[10px] border border-(--p-borde) text-(--p-suave) hover:bg-(--p-hover) hover:text-(--p-tinta)"
    >
      {copiado ? <I.Check tam={16} /> : <I.Copiar tam={16} />}
    </button>
  );
}

function PestanaDatos({ detalle }: { detalle: EstudianteDetalle }) {
  const anos = edad(detalle.fecha_nacimiento);
  return (
    <Bloque titulo="Datos personales">
      <dl>
        <Dato
          etiqueta="Documento"
          valor={documentoCompleto(detalle)}
          accion={<BotonCopiar texto={detalle.numero_identidad} etiqueta="Copiar número de documento" />}
        />
        <Dato
          etiqueta="Fecha de nacimiento"
          valor={<>{fechaDia(detalle.fecha_nacimiento)}{anos !== null && <span className="font-normal text-(--p-suave)"> · {anos} años</span>}</>}
        />
        <div className="grid grid-cols-2 gap-x-5">
          <Dato etiqueta="Sexo" valor={detalle.sexo ? SEXOS[detalle.sexo] : null} />
          <Dato etiqueta="Tipo de sangre (RH)" valor={detalle.rh} />
        </div>
        <Dato etiqueta="EPS" valor={detalle.eps} />
        <Dato etiqueta="Dirección" valor={detalle.direccion} />
      </dl>
      <div className="pt-3 border-t border-(--p-borde)">
        <p className="text-[11.03px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">Observaciones</p>
        <p className={`mt-2 rounded-[12px] bg-(--p-menta) px-4 py-3 text-[14.7px] leading-relaxed whitespace-pre-line ${detalle.observaciones ? '' : 'text-(--p-suave)'}`}>
          {detalle.observaciones || 'Sin observaciones registradas.'}
        </p>
      </div>
    </Bloque>
  );
}

/* ── Editar estudiante (modal) ─────────────────────────────────────
   Diseño: docs/Modal · Editar estudiante · Modo claro@1x.png y -oscuro. */

const TIPOS_DOCUMENTO: Record<TipoDocumento, string> = {
  RC: 'Registro civil',
  TI: 'Tarjeta de identidad',
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  PPT: 'Permiso por protección temporal',
  PA: 'Pasaporte',
};
const SEXOS: Record<Sexo, string> = { F: 'Femenino', M: 'Masculino' };
const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** "TI 1.034.567.210", o "Doc. …" si todavía no tiene tipo. */
function documentoCompleto(e: EstudianteListItem) {
  return `${e.tipo_documento ?? 'Doc.'} ${documento(e.numero_identidad)}`;
}

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const claseCampoModal =
  'w-full h-12 px-4 rounded-xl border border-(--p-borde) bg-(--p-campo) text-[14.5px] outline-none transition-colors ' +
  'focus:border-(--p-acento) focus:ring-3 focus:ring-(--p-acento)/25 aria-invalid:border-red-500';

function Campo({
  etiqueta, requerido = false, error, className = '', children,
}: { etiqueta: string; requerido?: boolean; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="block mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">
        {etiqueta}{requerido && <span className="text-(--p-tinta)"> *</span>}
      </span>
      {children}
      {error && <span className="block mt-1.5 text-[12.5px] font-medium text-red-600">{error}</span>}
    </label>
  );
}

function SelectModal({ value, onChange, children, invalido }: {
  value: string; onChange: (e: ChangeEvent<HTMLSelectElement>) => void; children: ReactNode; invalido?: boolean;
}) {
  return (
    <span className="relative block">
      <select value={value} onChange={onChange} aria-invalid={invalido || undefined}
        className={`${claseCampoModal} appearance-none pr-10 cursor-pointer`}>
        {children}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-(--p-suave)"><I.ChevronAbajo tam={16} /></span>
    </span>
  );
}

type FormEstudiante = {
  nombre: string; tipo_documento: TipoDocumento | ''; sexo: Sexo | ''; fecha_nacimiento: string;
  rh: string; eps: string; direccion: string; observaciones: string;
};

function DialogoEditarEstudiante({
  estudiante, onCerrar, onGuardado,
}: { estudiante: EstudianteListItem; onCerrar: () => void; onGuardado: (msg: string) => void }) {
  useEscape(onCerrar);
  const inicial = useMemo<FormEstudiante>(() => ({
    nombre: estudiante.nombre,
    tipo_documento: estudiante.tipo_documento ?? '',
    sexo: estudiante.sexo ?? '',
    fecha_nacimiento: estudiante.fecha_nacimiento?.slice(0, 10) ?? '',
    rh: estudiante.rh ?? '',
    eps: estudiante.eps ?? '',
    direccion: estudiante.direccion ?? '',
    observaciones: estudiante.observaciones ?? '',
  }), [estudiante]);
  const [form, setForm] = useState(inicial);
  const [errores, setErrores] = useState<Partial<Record<keyof FormEstudiante, string>>>({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo: keyof FormEstudiante) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [campo]: e.target.value }));
      setErrores(er => ({ ...er, [campo]: undefined }));
    };

  const cambios = (Object.keys(form) as (keyof FormEstudiante)[]).filter(k => form[k] !== inicial[k]);
  const actual = [...estudiante.matriculas].sort((a, b) => b.year - a.year)[0];

  async function guardar(ev: FormEvent) {
    ev.preventDefault();
    const nuevos: typeof errores = {};
    if (!form.nombre.trim()) nuevos.nombre = 'Escribe el nombre del estudiante.';
    if (!form.fecha_nacimiento) nuevos.fecha_nacimiento = 'Elige la fecha de nacimiento.';
    else if (form.fecha_nacimiento > hoyISO()) nuevos.fecha_nacimiento = 'La fecha no puede ser futura.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    if (!cambios.length) { onCerrar(); return; }

    // Solo se envía lo que cambió.
    const payload = Object.fromEntries(cambios.map(k => [k, typeof form[k] === 'string' ? form[k].trim() : form[k]]));
    setEnviando(true);
    setError('');
    try {
      await estudiantesApi.actualizar(estudiante.numero_identidad, payload);
      onGuardado(`Datos de ${form.nombre.trim()} actualizados.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar los cambios.');
      setEnviando(false);
    }
  }

  return (
    <Capa>
      <div className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-6">
        <div className="velo absolute inset-0 bg-black/45" onClick={onCerrar} />
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-editar"
          onSubmit={guardar}
          noValidate
          style={{ ...zoomCapa, maxHeight: `calc((100dvh - 24px) / ${ESCALA_CONTENIDO})` }}
          // Sin borde y sin fondo propio: así no asoma una línea clara en las esquinas del encabezado oscuro.
          className="dialogo relative w-full max-w-[720px] flex flex-col rounded-[24px] text-(--p-tinta) shadow-2xl overflow-hidden"
        >
          <header className="shrink-0 flex items-center gap-4 px-5 sm:px-6 py-5 bg-(--p-banda) text-white">
            <Avatar nombre={estudiante.nombre} destacado tam="size-12" />
            <div className="flex-1 min-w-0 leading-tight">
              <h2 id="titulo-editar" className="text-[18px] font-extrabold">Editar estudiante</h2>
              <p className="mt-1 text-[12.5px] text-white/70 truncate">
                {documentoCompleto(estudiante)}
                {actual?.grado && ` · ${actual.grado.nombre} ${actual.year}`}
              </p>
            </div>
            <button type="button" onClick={onCerrar} aria-label="Cerrar"
              className="grid place-items-center shrink-0 size-10 rounded-xl bg-white/10 text-white hover:bg-white/20">
              <I.Cerrar tam={18} />
            </button>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto bg-(--p-sup) px-5 sm:px-6 pt-5 pb-6">
            <div className="grid grid-cols-2 items-end gap-x-3 sm:gap-x-4 gap-y-4">
              <Campo etiqueta="Nombre completo" requerido error={errores.nombre} className="col-span-2">
                <input value={form.nombre} onChange={cambiar('nombre')} maxLength={150} autoFocus
                  aria-invalid={!!errores.nombre || undefined} className={claseCampoModal} />
              </Campo>

              <Campo etiqueta="Tipo de documento">
                <SelectModal value={form.tipo_documento} onChange={cambiar('tipo_documento')}>
                  <option value="" className="bg-(--p-sup)">Elegir…</option>
                  {(Object.entries(TIPOS_DOCUMENTO) as [TipoDocumento, string][]).map(([k, t]) => (
                    <option key={k} value={k} className="bg-(--p-sup)">{k} · {t}</option>
                  ))}
                </SelectModal>
              </Campo>
              <Campo etiqueta="Sexo">
                <SelectModal value={form.sexo} onChange={cambiar('sexo')}>
                  <option value="" className="bg-(--p-sup)">Elegir…</option>
                  {(Object.entries(SEXOS) as [Sexo, string][]).map(([k, t]) => (
                    <option key={k} value={k} className="bg-(--p-sup)">{t}</option>
                  ))}
                </SelectModal>
              </Campo>

              <Campo etiqueta="Fecha de nacimiento" requerido error={errores.fecha_nacimiento}>
                <input type="date" value={form.fecha_nacimiento} onChange={cambiar('fecha_nacimiento')} max={hoyISO()}
                  aria-invalid={!!errores.fecha_nacimiento || undefined} className={claseCampoModal} />
              </Campo>
              <Campo etiqueta="Tipo de sangre (RH)">
                <SelectModal value={form.rh} onChange={cambiar('rh')}>
                  <option value="" className="bg-(--p-sup)">Elegir…</option>
                  {TIPOS_SANGRE.map(t => <option key={t} value={t} className="bg-(--p-sup)">{t}</option>)}
                </SelectModal>
              </Campo>

              <Campo etiqueta="Dirección de residencia" className="col-span-2 sm:col-span-1">
                <input value={form.direccion} onChange={cambiar('direccion')} maxLength={200} className={claseCampoModal} />
              </Campo>
              <Campo etiqueta="EPS" className="col-span-2 sm:col-span-1">
                <input value={form.eps} onChange={cambiar('eps')} maxLength={100} placeholder="Ej.: Sura, Nueva EPS…"
                  className={`${claseCampoModal} placeholder:text-(--p-tenue)`} />
              </Campo>

              <Campo etiqueta="Observaciones" className="col-span-2">
                <textarea value={form.observaciones} onChange={cambiar('observaciones')} rows={4} maxLength={2000}
                  placeholder="Condiciones médicas, necesidades especiales…"
                  className={`${claseCampoModal} h-auto min-h-[104px] py-3 resize-y placeholder:text-(--p-tenue)`} />
              </Campo>
            </div>

            <div className="mt-5 flex rounded-xl border border-(--p-borde) bg-(--p-menta) overflow-hidden">
              <span className="grid place-items-center shrink-0 w-12 bg-(--p-icono) text-(--p-acento)"><I.Escudo tam={17} /></span>
              <p className="px-4 py-3 text-[13px] leading-relaxed text-(--p-suave)">
                El número de identidad <b className="text-(--p-tinta)">{documento(estudiante.numero_identidad)}</b> no puede
                modificarse. Si necesitas corregirlo, comunícate con el administrador del sistema.
              </p>
            </div>

            {error && <p role="alert" className="mt-4 text-[13.5px] font-medium text-red-600">{error}</p>}

            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
              <button type="button" onClick={onCerrar}
                className="h-12 rounded-xl border border-(--p-borde) bg-(--p-campo) text-[14px] font-bold hover:bg-(--p-hover)">
                Cancelar
              </button>
              <button type="submit" disabled={enviando}
                className="flex items-stretch h-12 rounded-xl overflow-hidden bg-(--p-acento) text-[#170f27] hover:brightness-105 disabled:opacity-60">
                <span className="grid place-items-center shrink-0 w-12 bg-(--p-acento-2)"><I.Guardar tam={17} /></span>
                <span className="flex-1 grid place-items-center px-2 text-[12px] sm:text-[12.5px] font-bold tracking-[0.14em]">
                  {enviando ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </Capa>
  );
}

function PestanaAcudientes({ detalle }: { detalle: EstudianteDetalle }) {
  const [credenciales, setCredenciales] = useState<Record<string, Credenciales>>({});
  const [enviando, setEnviando] = useState('');
  const [error, setError] = useState('');

  async function restablecer(cedula: string) {
    setEnviando(cedula);
    setError('');
    try {
      const c = await clavesApi.restablecer('acudiente', cedula);
      setCredenciales(prev => ({ ...prev, [cedula]: c }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setEnviando('');
    }
  }

  if (!detalle.acudientes.length) {
    return <p className="text-[14.7px] text-(--p-suave)">Este estudiante no tiene acudientes registrados.</p>;
  }

  const ordenados = [...detalle.acudientes].sort((a, b) => Number(!!b.RelacionEA?.acudiente_principal) - Number(!!a.RelacionEA?.acudiente_principal));
  return (
    <Bloque titulo={<>Acudientes <span className="font-medium text-(--p-suave)">({ordenados.length})</span></>}>
      <ErrorFormulario texto={error} />
      <ul className="space-y-3">
        {ordenados.map(a => {
          const c = credenciales[a.cedula];
          return (
            // Diseño: docs/Ficha del estudiante · Pestaña Acudientes (sin los íconos de cada dato).
            <li key={a.cedula} className="rounded-[18px] border border-(--p-borde) overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5 bg-(--p-menta)">
                <span className="grid place-items-center shrink-0 size-11 rounded-full bg-(--p-gris)/45 text-[13.65px] font-bold">
                  {iniciales(a.nombre)}
                </span>
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-[16.3px] font-bold truncate">{a.nombre}</p>
                  <p className="mt-0.5 text-[13.13px] text-(--p-suave)">
                    {a.RelacionEA?.parentesco ? capitalizar(a.RelacionEA.parentesco) : 'Acudiente'} · CC {documento(a.cedula)}
                  </p>
                </div>
                {a.RelacionEA?.acudiente_principal && (
                  <span className="shrink-0 h-6 px-2.5 flex items-center rounded-full bg-(--p-acento) text-[#170f27] text-[12.6px] font-bold">Principal</span>
                )}
              </div>
              <dl className="px-4">
                <DatoAcudiente etiqueta="Teléfono" valor={a.telefono} copiar="Copiar teléfono" telefono />
                <DatoAcudiente etiqueta="Correo" valor={a.correo} copiar="Copiar correo" />
                <DatoAcudiente etiqueta="Dirección" valor={a.direccion} />
                <DatoAcudiente etiqueta="Teléfono del trabajo" valor={a.telefono_trabajo} copiar="Copiar teléfono del trabajo" telefono />
                <DatoAcudiente etiqueta="Dirección del trabajo" valor={a.direccion_trabajo} />
              </dl>
              <div className="p-4 border-t border-(--p-borde)">
                {c ? (
                  <div className="rounded-[12px] bg-(--p-menta) px-4 py-3 text-[13.65px]">
                    Usuario <b>{c.username}</b> · Contraseña temporal <b>{c.passwordTemporal}</b>
                    <p className="mt-0.5 text-[12.6px] text-(--p-suave)">{c.nota}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => restablecer(a.cedula)}
                    disabled={enviando === a.cedula}
                    className="presionable w-full h-11 rounded-[12px] border border-(--p-borde) text-[12.6px] font-bold tracking-[0.12em] uppercase hover:bg-(--p-hover) disabled:opacity-60"
                  >
                    {enviando === a.cedula ? 'Restableciendo…' : 'Restablecer contraseña'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Bloque>
  );
}

/** "3114564410" → "311 456 4410" para leerlo fácil; si no son solo dígitos, se deja igual. */
function telefonoLegible(t: string | null) {
  if (!t) return t;
  const m = t.replace(/\s+/g, '').match(/^(\d{3})(\d{3})(\d+)$/);
  return m ? `${m[1]} ${m[2]} ${m[3]}` : t;
}

/** Fila de dato del acudiente; con `copiar`, muestra el botón de copiar si hay valor. */
function DatoAcudiente({
  etiqueta, valor, copiar, telefono = false,
}: { etiqueta: string; valor: string | null; copiar?: string; telefono?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3 border-t border-(--p-borde) first:border-t-0 min-w-0">
      <div className="flex-1 min-w-0">
        <dt className="text-[11.03px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">{etiqueta}</dt>
        <dd className="mt-0.5 text-[15.2px] font-semibold break-words">
          {(telefono ? telefonoLegible(valor) : valor) || <span className="font-normal italic text-(--p-tenue)">Sin dato</span>}
        </dd>
      </div>
      {valor && copiar && <BotonCopiar texto={valor} etiqueta={copiar} />}
    </div>
  );
}

/* Diseño: docs/Ficha del estudiante · Pestaña Matrículas (línea de tiempo, sin íconos de jornada). */
function PestanaMatriculas({ detalle, idActual }: { detalle: EstudianteDetalle; idActual: number | undefined }) {
  const matriculas = [...detalle.matriculas].sort((a, b) => b.year - a.year);
  const anos = new Set(matriculas.map(m => m.year)).size;
  return (
    <Bloque
      titulo="Historial de matrículas"
      accion={matriculas.length > 0 && <span className="text-[13.65px] text-(--p-suave)">{anos} {anos === 1 ? 'año' : 'años'}</span>}
    >
      {matriculas.length === 0 ? (
        <p className="text-[14.7px] text-(--p-suave)">Sin matrículas. Usa «Matricular» para crear la primera.</p>
      ) : (
        <ol>
          {matriculas.map((m, i) => {
            const esActual = m.id_matricula === idActual;
            const ultima = i === matriculas.length - 1;
            return (
              <li key={m.id_matricula} className="grid grid-cols-[auto_1fr] gap-x-3">
                {/* Año y la línea que lo une con el siguiente */}
                <div className="flex flex-col items-center">
                  <span className={`grid place-items-center h-8 px-3 rounded-[10px] text-[14.2px] font-bold tabular-nums ${
                    esActual ? 'bg-(--p-acento) text-[#170f27]' : 'bg-(--p-menta)'
                  }`}>
                    {m.year}
                  </span>
                  {!ultima && <span className="flex-1 w-px my-1.5 bg-(--p-borde)" aria-hidden />}
                </div>
                <div className={`flex items-center gap-3 min-w-0 rounded-[14px] border px-4 py-3 ${ultima ? '' : 'mb-3'} ${
                  esActual ? 'border-(--p-acento) border-[1.5px]' : 'border-(--p-borde)'
                }`}>
                  <div className="flex-1 min-w-0 leading-tight">
                    <p className="text-[15.75px] font-bold truncate">{m.grado?.nombre ?? '—'}</p>
                    <p className="mt-1 text-[13.13px] text-(--p-suave)">{capitalizar(m.jornada)} · desde {fechaDia(m.fecha_matricula)}</p>
                  </div>
                  <ChipEstado estado={m.estado} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Bloque>
  );
}

function PestanaPagos({ detalle, onIr }: { detalle: EstudianteDetalle; onIr: (s: Seccion) => void }) {
  const matriculas = [...detalle.matriculas].sort((a, b) => b.year - a.year);
  const [idMatricula, setIdMatricula] = useState<number | null>(matriculas[0]?.id_matricula ?? null);
  const [resumen, setResumen] = useState<ResumenPagos | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!idMatricula) return;
    let vigente = true;
    setResumen(null);
    pagosApi.getResumen(idMatricula)
      .then(r => { if (vigente) { setResumen(r); setError(''); } })
      .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo cargar el estado de cuenta.'); });
    return () => { vigente = false; };
  }, [idMatricula]);

  if (!idMatricula) return <p className="text-[14.7px] text-(--p-suave)">Sin matrículas, así que no hay pagos.</p>;

  return (
    <Bloque
      titulo="Estado de cuenta"
      accion={
        <select value={idMatricula} onChange={e => setIdMatricula(Number(e.target.value))}
          className="h-8 px-2.5 rounded-[10px] border border-(--p-borde) bg-transparent text-[13.13px] font-semibold outline-none cursor-pointer">
          {matriculas.map(m => <option key={m.id_matricula} value={m.id_matricula} className="bg-(--p-sup)">{m.year}</option>)}
        </select>
      }
    >
      {error ? (
        <p role="alert" className="text-[14.7px] text-red-600">{error}</p>
      ) : !resumen ? (
        <p className="text-[14.7px] text-(--p-suave)">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 rounded-[14px] border border-(--p-borde) divide-x divide-(--p-borde)">
            <Total etiqueta="Facturado" valor={resumen.totales.deuda} />
            <Total etiqueta="Pagado" valor={resumen.totales.pagado} />
            <Total etiqueta="Pendiente" valor={resumen.totales.pendiente} fuerte />
          </div>
          {resumen.cuentas.length === 0 ? (
            <p className="mt-4 text-[14.7px] text-(--p-suave)">Todavía no hay cuentas de cobro para este año.</p>
          ) : (
            <ul className="mt-4 divide-y divide-(--p-borde) rounded-[14px] border border-(--p-borde)">
              {[...resumen.cuentas].sort((a, b) => a.mes - b.mes).map(c => {
                const pagado = c.pagos.reduce((s, p) => s + parseFloat(p.monto_pago), 0);
                return (
                  <li key={c.id_cuenta} className="flex items-center gap-3 px-4 h-[54px]">
                    <div className="flex-1 min-w-0 leading-tight">
                      <p className="text-[14.18px] font-semibold">{capitalizar(c.concepto.nombre)}</p>
                      <p className="text-[12.6px] text-(--p-suave)">{capitalizar(MESES_LARGOS[c.mes - 1] ?? '')}{pagado > 0 && c.estado !== 'PAGADO' ? ` · abonado ${dineroCorto(pagado)}` : ''}</p>
                    </div>
                    <span className="text-[14.18px] font-bold">{dineroCorto(parseFloat(c.valor_deuda))}</span>
                    <ChipCuenta estado={c.estado} />
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" onClick={() => onIr('pagos')}
            className="mt-4 w-full h-10 rounded-[10px] bg-(--p-banda) text-white text-[12.08px] font-bold tracking-[0.12em]">
            REGISTRAR PAGO
          </button>
        </>
      )}
    </Bloque>
  );
}

function Total({ etiqueta, valor, fuerte = false }: { etiqueta: string; valor: number; fuerte?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11.55px] font-semibold tracking-[0.14em] uppercase text-(--p-suave)">{etiqueta}</p>
      <p className={`mt-1 text-[18.9px] font-extrabold ${fuerte && valor > 0 ? 'text-red-600' : ''}`}>{dineroCorto(valor)}</p>
    </div>
  );
}

function ChipCuenta({ estado }: { estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' }) {
  const estilos = {
    PAGADO: 'bg-(--p-acento) text-[#170f27]',
    PENDIENTE: 'bg-(--p-menta)',
    VENCIDO: 'bg-red-600 text-white',
  } as const;
  return <span className={`w-[84px] justify-center h-6 inline-flex items-center rounded-full text-[12.08px] font-bold ${estilos[estado]}`}>{capitalizar(estado)}</span>;
}
