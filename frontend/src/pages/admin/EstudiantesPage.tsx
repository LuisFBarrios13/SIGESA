// src/pages/admin/EstudiantesPage.tsx — listado y ficha de estudiantes.
// Diseño: docs/Estudiantes · Modo claro@1x.png y Estudiantes · Modo oscuro@1x.png.
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ComponentType, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { estudiantesApi, gradosApi, matriculasApi, clavesApi } from '../../services/api';
import { pagosApi, type ResumenPagos } from '../../services/pagosApi';
import type { EstudianteDetalle, EstudianteListItem, MatriculaListItem } from '../../types/estudiantes';
import type { Grado, Credenciales } from '../../types/shared';
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
  const [vista, setVista] = useState<'lista' | 'tarjetas'>('lista');

  // Ficha y diálogos
  const [ficha, setFicha] = useState<{ id: string; pestana: PestanaFicha; editar: boolean } | null>(null);
  const [rematricular, setRematricular] = useState<EstudianteListItem | null>(null);
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
    setFicha({ id: abrirId, pestana: 'datos', editar: false });
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
    const c = { total: base.length, ACTIVO: 0, RETIRADO: 0, GRADUADO: 0 };
    for (const { m } of base) if (m) c[m.estado]++;
    return c;
  }, [base]);

  const years = useMemo(() => {
    const s = new Set<number>([YEAR_ACTUAL]);
    estudiantes?.forEach(e => e.matriculas.forEach(m => s.add(m.year)));
    return [...s].sort((a, b) => b - a);
  }, [estudiantes]);


  const abrirFicha = (id: string, pestana: PestanaFicha = 'datos', editar = false) => setFicha({ id, pestana, editar });

  return (
    <main className="flex-1 flex flex-col">
      {/* Encabezado */}
      <div className="aparecer flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-tight font-extrabold tracking-tight">Estudiantes</h1>
          <p className="mt-1 text-[11.5px] font-semibold tracking-[0.18em] text-(--p-suave)">{fechaEncabezado(new Date(), true)}</p>
        </div>
        <div className="flex items-center gap-3">
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
        className="aparecer [--i:1] grid mt-6 sm:grid-cols-2 xl:grid-cols-4 rounded-[22px] bg-(--p-sup) border border-(--p-borde) overflow-hidden
                   divide-y sm:divide-y-0 xl:divide-x divide-(--p-borde) transition-colors"
      >
        <Indicador Icono={I.Estudiantes} cuadro="bg-(--p-acento) text-[#170f27]" titulo="Total" insignia="Todos"
          valor={estudiantes ? conteo.total : '—'} pct={conteo.total ? 100 : 0} clave={`t-${version}-${!!estudiantes}`} />
        <Indicador Icono={I.CheckCirculo} cuadro="bg-(--p-icono) text-(--p-acento)" titulo="Activos" insignia={`${pct(conteo.ACTIVO, conteo.total)}%`}
          valor={estudiantes ? conteo.ACTIVO : '—'} pct={pct(conteo.ACTIVO, conteo.total)} clave={`a-${version}-${!!estudiantes}`} />
        <Indicador Icono={I.PersonaX} cuadro="bg-[#adb5b0] text-[#170f27]" titulo="Retirados" insignia={`${pct(conteo.RETIRADO, conteo.total)}%`}
          valor={estudiantes ? conteo.RETIRADO : '—'} pct={pct(conteo.RETIRADO, conteo.total)} oscuro clave={`r-${version}-${!!estudiantes}`} />
        <Indicador Icono={I.Birrete} cuadro="bg-(--p-icono) text-(--p-acento)" titulo="Graduados" insignia={`${pct(conteo.GRADUADO, conteo.total)}%`}
          valor={estudiantes ? conteo.GRADUADO : '—'} pct={pct(conteo.GRADUADO, conteo.total)} clave={`g-${version}-${!!estudiantes}`} />
      </section>

      {aviso && (
        <div role="status" className="fundido mt-5 flex items-center gap-3 rounded-2xl bg-(--p-sup) border border-(--p-borde) px-5 py-3 text-[14px]">
          <span className="text-(--p-acento)"><I.CheckCirculo tam={19} /></span>
          <span className="flex-1">{aviso}</span>
          <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso" className="text-(--p-suave)"><I.Cerrar tam={16} /></button>
        </div>
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
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-(--p-borde)">
          <label className="flex-1 min-w-[240px] flex items-center gap-3 h-11 px-4 rounded-xl border border-(--p-borde) focus-within:border-(--p-acento) transition-colors">
            <span className="text-(--p-suave)"><I.Buscar tam={17} /></span>
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por nombre o número de identidad"
              aria-label="Buscar por nombre o número de identidad"
              className="flex-1 min-w-0 bg-transparent text-[14px] outline-none placeholder:text-(--p-suave)"
            />
          </label>
          <Filtro Icono={I.Birrete} etiqueta="Grado" valor={String(fGrado)} onCambio={v => setFGrado(v ? Number(v) : '')}
            opciones={[['', 'Todos los grados'], ...gradosUnicos(grados).map(g => [String(g.id_grado), `${g.nombre} · ${capitalizar(g.jornada)}`] as [string, string])]} />
          <Filtro Icono={I.SolRayos} etiqueta="Jornada" valor={fJornada} onCambio={v => setFJornada(v as typeof fJornada)}
            opciones={[['', 'Todas las jornadas'], ['MAÑANA', 'Mañana'], ['TARDE', 'Tarde']]} />
          <Filtro Icono={I.Calendario} etiqueta="Año" valor={String(fYear)} onCambio={v => setFYear(v === 'actual' || v === 'todos' ? v : Number(v))}
            opciones={[['actual', 'Año en curso'], ...years.filter(y => y !== YEAR_ACTUAL).map(y => [String(y), String(y)] as [string, string]), ['todos', 'Todos los años']]} />
          <Filtro Icono={I.Bandera} etiqueta="Estado" valor={fEstado} onCambio={v => setFEstado(v as typeof fEstado)}
            opciones={[['', 'Todos los estados'], ['ACTIVO', 'Activos'], ['RETIRADO', 'Retirados'], ['GRADUADO', 'Graduados']]} />
        </div>

        {!estudiantes && !cargando ? (
          <p className="px-5 py-8 text-[14px] text-(--p-suave)">No hay datos.</p>
        ) : estudiantes && filas.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[15px] font-semibold">No hay estudiantes que coincidan</p>
            <p className="mt-1 text-[13px] text-(--p-suave)">Prueba con otro nombre o quita algún filtro.</p>
          </div>
        ) : vista === 'lista' ? (
          <div>
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
                        <BotonAccion etiqueta="Editar datos" onClick={() => abrirFicha(e.numero_identidad, 'datos', true)}><I.Lapiz tam={16} /></BotonAccion>
                        <BotonAccion etiqueta="Acudientes" onClick={() => abrirFicha(e.numero_identidad, 'acudientes')}><I.Familia tam={16} /></BotonAccion>
                        <BotonAccion etiqueta="Rematricular" onClick={() => setRematricular(e)}><I.PersonaCheck tam={16} /></BotonAccion>
                        {m && m.estado !== 'GRADUADO' && (
                          <BotonAccion
                            etiqueta={m.estado === 'RETIRADO' ? 'Reactivar' : 'Retirar'}
                            onClick={() => setCambioEstado({ e, m })}
                          >
                            {m.estado === 'RETIRADO' ? <I.PersonaMas tam={16} /> : <I.PersonaMenos tam={16} />}
                          </BotonAccion>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !estudiantes ? (
          <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: FILAS_ESQUELETO }, (_, i) => <li key={i} className="h-[188px] rounded-[16px] border border-(--p-borde) esqueleto" />)}
          </ul>
        ) : (
          <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filas.map(({ e, m }, i) => (
              <li key={e.numero_identidad} className="aparecer-fila rounded-[16px] border border-(--p-borde) p-4" style={{ '--i': Math.min(i, 12) } as CSSProperties}>
                <div className="flex items-start gap-3">
                  <Avatar nombre={e.nombre} destacado={i === 0} />
                  <div className="flex-1 min-w-0 leading-tight">
                    <p className="text-[14px] font-semibold truncate">{e.nombre}</p>
                    <p className="text-[12px] text-(--p-suave) truncate">Doc. {documento(e.numero_identidad)}</p>
                  </div>
                  {m && <ChipEstado estado={m.estado} />}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-y-2 text-[12.5px]">
                  <dt className="text-(--p-suave)">Grado</dt><dd className="font-medium">{m?.grado?.nombre ?? '—'}</dd>
                  <dt className="text-(--p-suave)">Jornada</dt><dd>{m ? capitalizar(m.jornada) : '—'}</dd>
                  <dt className="text-(--p-suave)">Edad</dt><dd>{edad(e.fecha_nacimiento) ?? '—'} años</dd>
                </dl>
                <button
                  type="button"
                  onClick={() => abrirFicha(e.numero_identidad)}
                  className="mt-4 w-full h-9 rounded-[10px] bg-(--p-banda) text-white text-[11.5px] font-bold tracking-[0.12em]"
                >
                  VER FICHA
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ficha && (
        <FichaEstudiante
          key={ficha.id}
          id={ficha.id}
          pestanaInicial={ficha.pestana}
          editarInicial={ficha.editar}
          onCerrar={() => setFicha(null)}
          onCambio={msg => { setAviso(msg); recargar(); }}
          onRematricular={e => setRematricular(e)}
          onCambiarEstado={(e, m) => setCambioEstado({ e, m })}
          onIr={onIr}
        />
      )}

      {rematricular && (
        <DialogoRematricula
          estudiante={rematricular}
          grados={grados}
          onCerrar={() => setRematricular(null)}
          onListo={msg => { setRematricular(null); setAviso(msg); recargar(); }}
        />
      )}

      {cambioEstado && (
        <DialogoEstado
          estudiante={cambioEstado.e}
          matricula={cambioEstado.m}
          onCerrar={() => setCambioEstado(null)}
          onListo={msg => { setCambioEstado(null); setAviso(msg); recargar(); }}
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
    <div className="px-[22px] pt-5 pb-[22px]">
      <div className="flex items-center gap-3">
        <span className={`grid place-items-center shrink-0 size-9 rounded-[10px] ${cuadro}`}><Icono tam={18} /></span>
        <p className="flex-1 text-[11.5px] font-semibold tracking-[0.16em] uppercase text-(--p-suave) truncate">{titulo}</p>
        <span className="h-6 px-2.5 flex items-center rounded-full bg-(--p-menta) text-[12px] font-bold">{insignia}</span>
      </div>
      <p className="mt-3 text-[31px] leading-none font-extrabold tracking-tight">{valor}</p>
      <div className="mt-4">
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

function ChipJornada({ jornada }: { jornada: 'MAÑANA' | 'TARDE' }) {
  const manana = jornada === 'MAÑANA';
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[8px] text-[12px] font-semibold ${
      manana ? 'bg-(--p-acento)/25' : 'bg-(--p-menta)'
    }`}>
      {manana ? <I.SolRayos tam={13} /> : <I.Atardecer tam={13} />}
      {manana ? 'Mañana' : 'Tarde'}
    </span>
  );
}

function ChipEstado({ estado }: { estado: Estado }) {
  const estilos: Record<Estado, string> = {
    ACTIVO: 'bg-(--p-acento) text-[#170f27]',
    RETIRADO: 'bg-(--p-menta) text-(--p-suave)',
    GRADUADO: 'bg-(--p-icono) text-(--p-icono-txt)',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[12px] font-bold ${estilos[estado]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {capitalizar(estado)}
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
  Icono, etiqueta, valor, onCambio, opciones,
}: {
  Icono: ComponentType<{ tam?: number }>;
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  opciones: [string, string][];
}) {
  return (
    <label className="relative flex items-center w-[210px] h-11 rounded-xl border border-(--p-borde) focus-within:border-(--p-acento) transition-colors">
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

const claseCampo = 'w-full h-11 px-3.5 rounded-xl border border-(--p-borde) bg-transparent text-[14px] outline-none focus:border-(--p-acento) transition-colors';

function DialogoRematricula({
  estudiante, grados, onCerrar, onListo,
}: { estudiante: EstudianteListItem; grados: Grado[]; onCerrar: () => void; onListo: (msg: string) => void }) {
  const ultima = [...estudiante.matriculas].sort((a, b) => b.year - a.year)[0];
  const [year, setYear] = useState((ultima?.year ?? YEAR_ACTUAL - 1) + 1);
  const [idGrado, setIdGrado] = useState<number | ''>('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    if (!idGrado) { setError('Elige el grado.'); return; }
    setEnviando(true);
    setError('');
    try {
      await matriculasApi.rematricular({ id_estudiante: estudiante.numero_identidad, id_grado: idGrado, year });
      onListo(`${estudiante.nombre} quedó matriculado en ${year}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo rematricular.');
      setEnviando(false);
    }
  }

  return (
    <Dialogo titulo="Rematricular" onCerrar={onCerrar}>
      <form onSubmit={enviar} noValidate>
        <div className="flex items-center gap-3">
          <Avatar nombre={estudiante.nombre} />
          <div className="leading-tight">
            <p className="text-[14px] font-semibold">{estudiante.nombre}</p>
            <p className="text-[12px] text-(--p-suave)">
              {ultima ? `Último año: ${ultima.year} · ${ultima.grado?.nombre ?? ''}` : 'Sin matrículas anteriores'}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[110px_1fr] gap-3">
          <label className="text-[12.5px] font-semibold">
            Año
            <input type="number" value={year} min={2000} onChange={e => setYear(Number(e.target.value))} className={`${claseCampo} mt-1.5`} />
          </label>
          <label className="text-[12.5px] font-semibold">
            Grado
            <select value={idGrado} onChange={e => setIdGrado(e.target.value ? Number(e.target.value) : '')} className={`${claseCampo} mt-1.5 cursor-pointer`}>
              <option value="" className="bg-(--p-sup)">Elige un grado</option>
              {gradosUnicos(grados).map(g => (
                <option key={g.id_grado} value={g.id_grado} className="bg-(--p-sup)">{g.nombre} · {capitalizar(g.jornada)}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-[12.5px] text-(--p-suave)">El acudiente sigue siendo el mismo y la jornada es la del grado elegido.</p>
        <ErrorFormulario texto={error} />
        <BotonesDialogo onCancelar={onCerrar} texto="Rematricular" enviando={enviando} />
      </form>
    </Dialogo>
  );
}

function DialogoEstado({
  estudiante, matricula, onCerrar, onListo,
}: { estudiante: { nombre: string }; matricula: MatriculaListItem; onCerrar: () => void; onListo: (msg: string) => void }) {
  const retirar = matricula.estado === 'ACTIVO';
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const r = await matriculasApi.cambiarEstado(matricula.id_matricula, retirar ? 'RETIRADO' : 'ACTIVO');
      onListo(retirar
        ? `${estudiante.nombre} fue retirado.${r.cuentasEliminadas ? ` Se quitaron ${r.cuentasEliminadas} pensiones futuras sin pagos.` : ''}`
        : `${estudiante.nombre} fue reactivado.`);
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
        <ErrorFormulario texto={error} />
        <BotonesDialogo onCancelar={onCerrar} texto={retirar ? 'Retirar' : 'Reactivar'} enviando={enviando} peligro={retirar} />
      </form>
    </Dialogo>
  );
}

/* ── Ficha del estudiante ──────────────────────────────────────── */

function FichaEstudiante({
  id, pestanaInicial, editarInicial, onCerrar, onCambio, onRematricular, onCambiarEstado, onIr,
}: {
  id: string;
  pestanaInicial: PestanaFicha;
  editarInicial: boolean;
  onCerrar: () => void;
  onCambio: (msg: string) => void;
  onRematricular: (e: EstudianteListItem) => void;
  onCambiarEstado: (e: EstudianteListItem, m: MatriculaListItem) => void;
  onIr: (s: Seccion) => void;
}) {
  const [detalle, setDetalle] = useState<EstudianteDetalle | null>(null);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState<PestanaFicha>(pestanaInicial);
  const [version, setVersion] = useState(0);
  useEscape(onCerrar);

  useEffect(() => {
    let vigente = true;
    estudiantesApi.obtener(id)
      .then(d => { if (vigente) { setDetalle(d); setError(''); } })
      .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo cargar la ficha.'); });
    return () => { vigente = false; };
  }, [id, version]);

  const pestanas: [PestanaFicha, string][] = [['datos', 'Datos'], ['acudientes', 'Acudientes'], ['matriculas', 'Matrículas'], ['pagos', 'Pagos']];
  const actual = detalle ? [...detalle.matriculas].sort((a, b) => b.year - a.year)[0] : undefined;

  return (
    <Capa>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="velo absolute inset-0 bg-black/35" onClick={onCerrar} />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Ficha del estudiante"
          style={{ ...zoomCapa, height: `calc(100dvh / ${ESCALA_CONTENIDO})` }}
          className="cajon relative w-full max-w-[540px] flex flex-col bg-(--p-sup) text-(--p-tinta) border-l border-(--p-borde) shadow-2xl"
        >
          <header className="shrink-0 bg-(--p-banda) text-white px-5 pt-4 pb-0">
            <div className="flex items-start gap-3">
              {detalle ? <Avatar nombre={detalle.nombre} destacado tam="size-11" /> : <span className="size-11" />}
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-[11px] font-bold tracking-[0.16em] text-white/60">FICHA DEL ESTUDIANTE</p>
                <h2 className="mt-1 text-[19px] font-extrabold truncate">{detalle?.nombre ?? 'Cargando…'}</h2>
                {detalle && (
                  <p className="mt-0.5 text-[12.5px] text-white/70">
                    Doc. {documento(detalle.numero_identidad)}
                    {actual?.grado && ` · ${actual.grado.nombre} ${actual.year}`}
                  </p>
                )}
              </div>
              <button type="button" onClick={onCerrar} aria-label="Cerrar ficha" className="grid place-items-center size-8 text-white/70 hover:text-white">
                <I.Cerrar tam={18} />
              </button>
            </div>
            <nav className="mt-4 flex gap-1" role="tablist">
              {pestanas.map(([p, t]) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={pestana === p}
                  onClick={() => setPestana(p)}
                  className={`h-10 px-3.5 rounded-t-[10px] text-[11.5px] font-bold tracking-[0.12em] uppercase ${
                    pestana === p ? 'bg-(--p-sup) text-(--p-tinta)' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </nav>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {error ? (
              <p role="alert" className="text-[14px] text-red-600">{error}</p>
            ) : !detalle ? (
              <p className="text-[14px] text-(--p-suave)">Cargando…</p>
            ) : (
              <div key={pestana} className="fundido">
                {pestana === 'datos' && (
                  <PestanaDatos
                    detalle={detalle}
                    editarInicial={editarInicial}
                    onGuardado={() => { setVersion(v => v + 1); onCambio('Datos del estudiante actualizados.'); }}
                  />
                )}
                {pestana === 'acudientes' && <PestanaAcudientes detalle={detalle} />}
                {pestana === 'matriculas' && (
                  <PestanaMatriculas
                    detalle={detalle}
                    onRematricular={() => onRematricular(detalle)}
                    onCambiarEstado={m => onCambiarEstado(detalle, m)}
                  />
                )}
                {pestana === 'pagos' && <PestanaPagos detalle={detalle} onIr={onIr} />}
              </div>
            )}
          </div>
        </aside>
      </div>
    </Capa>
  );
}

function Bloque({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-[11px] font-bold tracking-[0.16em] uppercase text-(--p-suave)">{titulo}</h3>
        {accion}
      </div>
      {children}
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-(--p-suave)">{etiqueta}</dt>
      <dd className="mt-0.5 text-[14px] font-medium break-words">{valor || <span className="text-(--p-tenue)">Sin dato</span>}</dd>
    </div>
  );
}

function PestanaDatos({ detalle, editarInicial, onGuardado }: { detalle: EstudianteDetalle; editarInicial: boolean; onGuardado: () => void }) {
  const [editando, setEditando] = useState(editarInicial);
  const [form, setForm] = useState({
    nombre: detalle.nombre,
    fecha_nacimiento: detalle.fecha_nacimiento?.slice(0, 10) ?? '',
    rh: detalle.rh ?? '',
    direccion: detalle.direccion ?? '',
    observaciones: detalle.observaciones ?? '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const cambiar = (campo: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [campo]: e.target.value }));

  async function guardar(ev: FormEvent) {
    ev.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre no puede quedar vacío.'); return; }
    setEnviando(true);
    setError('');
    try {
      await estudiantesApi.actualizar(detalle.numero_identidad, { ...form, nombre: form.nombre.trim() });
      setEditando(false);
      onGuardado();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar los cambios.');
    } finally {
      setEnviando(false);
    }
  }

  if (!editando) {
    const anos = edad(detalle.fecha_nacimiento);
    return (
      <Bloque
        titulo="Datos personales"
        accion={
          <button type="button" onClick={() => setEditando(true)}
            className="flex items-center gap-2 h-8 px-3 rounded-[10px] bg-(--p-acento) text-[#170f27] text-[11.5px] font-bold tracking-[0.12em]">
            <I.Lapiz tam={14} /> EDITAR
          </button>
        }
      >
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Dato etiqueta="Nombre completo" valor={detalle.nombre} />
          <Dato etiqueta="Documento" valor={documento(detalle.numero_identidad)} />
          <Dato etiqueta="Fecha de nacimiento" valor={`${fechaDia(detalle.fecha_nacimiento)}${anos !== null ? ` · ${anos} años` : ''}`} />
          <Dato etiqueta="RH" valor={detalle.rh} />
          <div className="col-span-2"><Dato etiqueta="Dirección" valor={detalle.direccion} /></div>
          <div className="col-span-2"><Dato etiqueta="Observaciones" valor={detalle.observaciones} /></div>
        </dl>
      </Bloque>
    );
  }

  return (
    <form onSubmit={guardar} noValidate>
      <Bloque titulo="Editar datos personales">
        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 text-[12.5px] font-semibold">
            Nombre completo
            <input value={form.nombre} onChange={cambiar('nombre')} maxLength={150} className={`${claseCampo} mt-1.5`} />
          </label>
          <label className="text-[12.5px] font-semibold">
            Fecha de nacimiento
            <input type="date" value={form.fecha_nacimiento} onChange={cambiar('fecha_nacimiento')} className={`${claseCampo} mt-1.5`} />
          </label>
          <label className="text-[12.5px] font-semibold">
            RH
            <input value={form.rh} onChange={cambiar('rh')} maxLength={5} placeholder="O+" className={`${claseCampo} mt-1.5`} />
          </label>
          <label className="col-span-2 text-[12.5px] font-semibold">
            Dirección
            <input value={form.direccion} onChange={cambiar('direccion')} maxLength={200} className={`${claseCampo} mt-1.5`} />
          </label>
          <label className="col-span-2 text-[12.5px] font-semibold">
            Observaciones
            <textarea value={form.observaciones} onChange={cambiar('observaciones')} rows={4} maxLength={2000}
              className={`${claseCampo} mt-1.5 h-auto py-2.5 resize-y`} />
          </label>
        </div>
        <p className="mt-3 text-[12px] text-(--p-suave)">El documento no se puede cambiar.</p>
        <ErrorFormulario texto={error} />
        <BotonesDialogo onCancelar={() => setEditando(false)} texto="Guardar" enviando={enviando} />
      </Bloque>
    </form>
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
    return <p className="text-[14px] text-(--p-suave)">Este estudiante no tiene acudientes registrados.</p>;
  }

  const ordenados = [...detalle.acudientes].sort((a, b) => Number(!!b.RelacionEA?.acudiente_principal) - Number(!!a.RelacionEA?.acudiente_principal));
  return (
    <Bloque titulo={`Acudientes (${ordenados.length})`}>
      <ErrorFormulario texto={error} />
      <ul className="space-y-3">
        {ordenados.map(a => {
          const c = credenciales[a.cedula];
          return (
            <li key={a.cedula} className="rounded-[14px] border border-(--p-borde) p-4">
              <div className="flex items-start gap-3">
                <Avatar nombre={a.nombre} destacado={!!a.RelacionEA?.acudiente_principal} />
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-[14px] font-semibold">{a.nombre}</p>
                  <p className="text-[12px] text-(--p-suave)">
                    {a.RelacionEA?.parentesco ?? 'Acudiente'} · C.C. {documento(a.cedula)}
                  </p>
                </div>
                {a.RelacionEA?.acudiente_principal && (
                  <span className="h-6 px-2.5 flex items-center rounded-full bg-(--p-acento) text-[#170f27] text-[11.5px] font-bold">Principal</span>
                )}
              </div>
              <dl className="mt-3 space-y-1.5 text-[13px]">
                <div className="flex items-center gap-2"><span className="text-(--p-suave)"><I.Telefono tam={15} /></span>{a.telefono || <span className="text-(--p-tenue)">Sin teléfono</span>}</div>
                <div className="flex items-center gap-2"><span className="text-(--p-suave)"><I.Correo tam={15} /></span>{a.correo || <span className="text-(--p-tenue)">Sin correo</span>}</div>
              </dl>
              {c ? (
                <div className="mt-3 rounded-[10px] bg-(--p-menta) px-3.5 py-2.5 text-[13px]">
                  Usuario <b>{c.username}</b> · Contraseña temporal <b>{c.passwordTemporal}</b>
                  <p className="mt-0.5 text-[12px] text-(--p-suave)">{c.nota}</p>
                </div>
              ) : (
                <button type="button" onClick={() => restablecer(a.cedula)} disabled={enviando === a.cedula}
                  className="mt-3 flex items-center gap-2 h-8 px-3 rounded-[10px] border border-(--p-borde) text-[12.5px] font-semibold hover:bg-(--p-hover) disabled:opacity-60">
                  <I.Llave tam={14} /> {enviando === a.cedula ? 'Restableciendo…' : 'Restablecer contraseña'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Bloque>
  );
}

function PestanaMatriculas({
  detalle, onRematricular, onCambiarEstado,
}: { detalle: EstudianteDetalle; onRematricular: () => void; onCambiarEstado: (m: MatriculaListItem) => void }) {
  const matriculas = [...detalle.matriculas].sort((a, b) => b.year - a.year);
  return (
    <Bloque
      titulo="Historial de matrículas"
      accion={
        <button type="button" onClick={onRematricular}
          className="flex items-center gap-2 h-8 px-3 rounded-[10px] bg-(--p-acento) text-[#170f27] text-[11.5px] font-bold tracking-[0.12em]">
          <I.PersonaCheck tam={14} /> REMATRICULAR
        </button>
      }
    >
      {matriculas.length === 0 ? (
        <p className="text-[14px] text-(--p-suave)">Sin matrículas.</p>
      ) : (
        <ul className="space-y-3">
          {matriculas.map(m => (
            <li key={m.id_matricula} className="flex items-center gap-4 rounded-[14px] border border-(--p-borde) p-4">
              <span className="text-[22px] font-extrabold tabular-nums">{m.year}</span>
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-[14px] font-semibold">{m.grado?.nombre ?? '—'}</p>
                <p className="text-[12px] text-(--p-suave)">{capitalizar(m.jornada)} · desde {fechaDia(m.fecha_matricula)}</p>
              </div>
              <ChipEstado estado={m.estado} />
              {m.estado !== 'GRADUADO' && (
                <BotonAccion etiqueta={m.estado === 'RETIRADO' ? 'Reactivar' : 'Retirar'} onClick={() => onCambiarEstado(m)}>
                  {m.estado === 'RETIRADO' ? <I.PersonaMas tam={16} /> : <I.PersonaMenos tam={16} />}
                </BotonAccion>
              )}
            </li>
          ))}
        </ul>
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

  if (!idMatricula) return <p className="text-[14px] text-(--p-suave)">Sin matrículas, así que no hay pagos.</p>;

  return (
    <Bloque
      titulo="Estado de cuenta"
      accion={
        <select value={idMatricula} onChange={e => setIdMatricula(Number(e.target.value))}
          className="h-8 px-2.5 rounded-[10px] border border-(--p-borde) bg-transparent text-[12.5px] font-semibold outline-none cursor-pointer">
          {matriculas.map(m => <option key={m.id_matricula} value={m.id_matricula} className="bg-(--p-sup)">{m.year}</option>)}
        </select>
      }
    >
      {error ? (
        <p role="alert" className="text-[14px] text-red-600">{error}</p>
      ) : !resumen ? (
        <p className="text-[14px] text-(--p-suave)">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 rounded-[14px] border border-(--p-borde) divide-x divide-(--p-borde)">
            <Total etiqueta="Facturado" valor={resumen.totales.deuda} />
            <Total etiqueta="Pagado" valor={resumen.totales.pagado} />
            <Total etiqueta="Pendiente" valor={resumen.totales.pendiente} fuerte />
          </div>
          {resumen.cuentas.length === 0 ? (
            <p className="mt-4 text-[14px] text-(--p-suave)">Todavía no hay cuentas de cobro para este año.</p>
          ) : (
            <ul className="mt-4 divide-y divide-(--p-borde) rounded-[14px] border border-(--p-borde)">
              {[...resumen.cuentas].sort((a, b) => a.mes - b.mes).map(c => {
                const pagado = c.pagos.reduce((s, p) => s + parseFloat(p.monto_pago), 0);
                return (
                  <li key={c.id_cuenta} className="flex items-center gap-3 px-4 h-[54px]">
                    <div className="flex-1 min-w-0 leading-tight">
                      <p className="text-[13.5px] font-semibold">{capitalizar(c.concepto.nombre)}</p>
                      <p className="text-[12px] text-(--p-suave)">{capitalizar(MESES_LARGOS[c.mes - 1] ?? '')}{pagado > 0 && c.estado !== 'PAGADO' ? ` · abonado ${dineroCorto(pagado)}` : ''}</p>
                    </div>
                    <span className="text-[13.5px] font-bold">{dineroCorto(parseFloat(c.valor_deuda))}</span>
                    <ChipCuenta estado={c.estado} />
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" onClick={() => onIr('pagos')}
            className="mt-4 w-full h-10 rounded-[10px] bg-(--p-banda) text-white text-[11.5px] font-bold tracking-[0.12em]">
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
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-(--p-suave)">{etiqueta}</p>
      <p className={`mt-1 text-[18px] font-extrabold ${fuerte && valor > 0 ? 'text-red-600' : ''}`}>{dineroCorto(valor)}</p>
    </div>
  );
}

function ChipCuenta({ estado }: { estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' }) {
  const estilos = {
    PAGADO: 'bg-(--p-acento) text-[#170f27]',
    PENDIENTE: 'bg-(--p-menta)',
    VENCIDO: 'bg-red-600 text-white',
  } as const;
  return <span className={`w-[84px] justify-center h-6 inline-flex items-center rounded-full text-[11.5px] font-bold ${estilos[estado]}`}>{capitalizar(estado)}</span>;
}
