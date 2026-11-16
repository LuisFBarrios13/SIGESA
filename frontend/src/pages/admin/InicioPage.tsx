// src/pages/admin/InicioPage.tsx — dashboard del administrador.
// Estilo: docs/panel-admin-inicio-claro.png y -oscuro.png.
// Distribución: docs/distribucion.png (indicadores, gráfica + lista, tabla a lo ancho).
import { useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import type { AuthUser } from '../../types/auth';
import type { DashboardData, MesRecaudo } from '../../types/dashboard';
import type { Seccion } from '../../layouts/AdminLayout';
import {
  dineroCorto, documento, fechaEncabezado, iniciales, listaY, MESES_LARGOS, nombreGrado, saludo,
} from '../../utils/formato';
import * as I from '../../components/iconos';
import { Progreso, Segmentos, Tarjeta } from '../../components/panel';

interface Props {
  user: AuthUser;
  year: number;
  onCambiarYear: (y: number) => void;
  onIr: (s: Seccion) => void;
  data: DashboardData | null;
  cargando: boolean;
  error: string;
  recargar: () => void;
  /** Veces que han llegado datos: al recargar se repiten las animaciones. */
  cargas: number;
}

/** Un mes terminado está atrasado si se recaudó menos de este porcentaje de lo facturado. */
const UMBRAL_ATRASO = 0.8;

export default function InicioPage({ user, year, onCambiarYear, onIr, data, cargando, error, recargar, cargas }: Props) {
  const yearActual = new Date().getFullYear();
  const years = [yearActual + 1, yearActual, yearActual - 1, yearActual - 2, yearActual - 3];
  if (!years.includes(year)) years.push(year);

  return (
    <main className="flex-1 flex flex-col">
      {/* Encabezado
          Celular: saludo a lo ancho y debajo la fecha con el año.
          Tablet y computador: saludo y fecha a la izquierda, año a la derecha. */}
      <div className="aparecer flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4 lg:flex-wrap lg:items-start">
        <div className="min-w-0">
          <h1 className="text-[clamp(21px,6.6vw,25px)] sm:text-[28px] lg:text-[32px] leading-[1.15] lg:leading-tight font-extrabold tracking-tight">
            {saludo()}, {primerNombre(user)}
          </h1>
          <p className="hidden sm:block mt-1 text-[10.5px] lg:text-[11.5px] font-semibold tracking-[0.18em] text-(--p-suave)">{fechaEncabezado()}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="sm:hidden min-w-0 text-[10px] font-semibold tracking-[0.14em] text-(--p-suave)">{fechaEncabezado()}</p>
          <div className="shrink-0 flex items-stretch h-11 rounded-xl bg-(--p-sup) border border-(--p-borde) overflow-hidden">
            <label htmlFor="year" className="hidden lg:flex items-center px-4 text-[11px] font-bold tracking-[0.16em] text-(--p-suave) border-r border-(--p-borde)">
              AÑO ACADÉMICO
            </label>
            <div className="relative flex items-center">
              <select
                id="year"
                value={year}
                onChange={e => onCambiarYear(Number(e.target.value))}
                aria-label="Año académico"
                className="appearance-none h-full bg-transparent pl-3 pr-8 sm:pl-4 sm:pr-9 text-[15px] lg:text-[17px] font-bold outline-none cursor-pointer"
              >
                {years.map(y => <option key={y} value={y} className="bg-(--p-sup)">{y}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2.5 sm:right-3"><I.ChevronAbajo tam={16} /></span>
            </div>
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
            className="hidden lg:flex items-center gap-2 h-11 px-5 rounded-xl bg-(--p-banda) text-white text-[12.5px] font-bold tracking-[0.12em]
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

      <Indicadores data={data} year={year} cargas={cargas} />

      {/* Celular: todo en una columna. Tablet: gráfica a lo ancho y debajo deudores y pagos lado a lado.
          Computador: gráfica y deudores (lado a lado en pantallas anchas) y la tabla de actividad aparte. */}
      <div
        className="aparecer [--i:2] grid gap-4 lg:gap-5 mt-4 lg:mt-5 md:max-lg:grid-cols-2
                   min-[1400px]:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)]"
      >
        <RecaudoPorMes
          meses={data?.monthlyChart ?? null}
          year={year}
          cargas={cargas}
          className="min-w-0 md:max-lg:col-span-2"
        />
        <MayoresDeudores data={data} onIr={onIr} />
        <UltimosPagosMovil data={data} onIr={onIr} />
      </div>

      <div className="hidden lg:block">
        <Actividad data={data} onIr={onIr} />
      </div>
    </main>
  );
}

function primerNombre(user: AuthUser) {
  return (user.nombre || user.username).trim().split(/\s+/)[0];
}

const pct = (parte: number, total: number) => (total > 0 ? Math.min(100, Math.round((parte / total) * 100)) : 0);

/* ── Indicadores (una sola tarjeta dividida en 4, como en el diseño) ── */

function Indicadores({ data, year, cargas }: { data: DashboardData | null; year: number; cargas: number }) {
  const d = data;
  const recaudadoPct = d ? pct(d.totalRecaudado, d.totalDeuda) : 0;
  const vencidaPct = d ? pct(d.carteraVencida, d.totalDeuda) : 0;
  // Las barras se animan de nuevo cuando llegan los datos o cambia el año.
  const clave = d ? `datos-${year}-${cargas}` : 'cargando';

  return (
    <section
      aria-label="Indicadores"
      // Celular y tablet: cuatro tarjetas sueltas. Computador: una sola tarjeta dividida.
      className="aparecer [--i:1] grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 lg:mt-6 lg:gap-0 lg:grid-cols-2 xl:grid-cols-4
                 lg:rounded-[22px] lg:bg-(--p-sup) lg:border lg:border-(--p-borde) lg:overflow-hidden
                 xl:divide-x divide-(--p-borde) transition-colors"
    >
      <Indicador
        Icono={I.Estudiantes}
        cuadro="bg-(--p-acento) text-[#170f27]"
        titulo={<Corto movil="Estudiantes">Estudiantes activos</Corto>}
        valor={d ? d.estudiantesActivos.toLocaleString('es-CO') : '—'}
        barra={<Progreso key={clave} valor={d?.tasaMatricula ?? 0} relleno="bg-(--p-acento)" borde="border-(--p-acento)" />}
        pie={d ? <>de {d.totalEstudiantes.toLocaleString('es-CO')}<Corto movil=""> registrados</Corto> · <b className="text-(--p-tinta)">{d.tasaMatricula}%</b></> : ' '}
      />
      <Indicador
        Icono={I.Persona}
        cuadro="bg-(--p-icono) text-(--p-icono-txt)"
        titulo="Docentes"
        valor={d ? d.totalDocentes.toLocaleString('es-CO') : '—'}
        barra={<Segmentos key={clave} n={d?.totalDocentes ?? 0} />}
        pie={<Corto movil="Planta activa">Planta docente activa</Corto>}
      />
      <Indicador
        Icono={I.Billete}
        cuadro="bg-[#adb5b0] text-[#170f27]"
        titulo={<Corto movil="Recaudado">Recaudado {year}</Corto>}
        valor={d ? dineroCorto(d.totalRecaudado) : '—'}
        barra={<Progreso key={clave} valor={recaudadoPct} relleno="bg-(--p-acento)" borde="border-(--p-acento)" />}
        pie={d ? <><b className="text-(--p-tinta)">{recaudadoPct}%</b> de {dineroCorto(d.totalDeuda)}<Corto movil=""> facturado</Corto></> : ' '}
      />
      <Indicador
        Icono={I.Alerta}
        cuadro="bg-(--p-icono) text-(--p-acento)"
        titulo={<Corto movil="Cartera">Cartera vencida</Corto>}
        valor={d ? dineroCorto(d.carteraVencida) : '—'}
        barra={<Progreso key={clave} valor={vencidaPct} relleno="bg-(--p-linea)" borde="border-(--p-linea)" />}
        pie={
          d ? (
            <>
              <b className="text-(--p-tinta)">{d.totalDeudores} {d.totalDeudores === 1 ? 'estudiante' : 'estudiantes'}</b>
              <Corto movil=" en mora"> con saldo vencido</Corto>
            </>
          ) : ' '
        }
      />
    </section>
  );
}

/** Texto más corto en celular y tablet, donde las tarjetas son angostas. */
function Corto({ movil, children }: { movil: string; children: ReactNode }) {
  return (
    <>
      {movil && <span className="lg:hidden">{movil}</span>}
      <span className="hidden lg:inline">{children}</span>
    </>
  );
}

function Indicador({
  Icono, cuadro, titulo, valor, barra, pie,
}: {
  Icono: ComponentType<{ tam?: number }>;
  cuadro: string;
  titulo: ReactNode;
  valor: string;
  barra: ReactNode;
  pie: ReactNode;
}) {
  return (
    <div
      className="min-w-0 px-3 min-[400px]:px-3.5 pt-3.5 pb-4 lg:px-[22px] lg:pt-5 lg:pb-[22px]
                 max-lg:rounded-[20px] max-lg:bg-(--p-sup) max-lg:border max-lg:border-(--p-borde) transition-colors"
    >
      <div className="flex items-center gap-2 min-[400px]:gap-2.5 lg:gap-3">
        <span className={`grid place-items-center shrink-0 size-7 lg:size-9 rounded-lg lg:rounded-[10px] [&>svg]:size-[15px] lg:[&>svg]:size-[18px] ${cuadro}`}>
          <Icono tam={18} />
        </span>
        <p className="text-[9px] min-[400px]:text-[9.5px] lg:text-[11.5px] font-semibold tracking-[0.1em] min-[400px]:tracking-[0.14em] lg:tracking-[0.12em] min-[1600px]:tracking-[0.16em] uppercase text-(--p-suave) truncate">{titulo}</p>
      </div>
      <p className="mt-3 text-[24px] lg:text-[31px] leading-none font-extrabold tracking-tight">{valor}</p>
      <div className="mt-3.5 lg:mt-4">{barra}</div>
      <p className="mt-3 lg:mt-3.5 text-[11px] lg:text-[12.5px] leading-snug text-(--p-suave) lg:truncate">{pie}</p>
    </div>
  );
}

/* ── Recaudo por mes ───────────────────────────────────────────── */

/** Divide el eje en 4 pasos "redondos" (1, 2, 2.5, 5 × 10ⁿ). */
function escalaEje(max: number): { tope: number; paso: number } {
  if (max <= 0) return { tope: 4, paso: 1 };
  const bruto = max / 4;
  const base = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map(m => m * base).find(p => p >= bruto) ?? 10 * base;
  return { tope: paso * 4, paso };
}

function RecaudoPorMes({
  meses, year, cargas, className,
}: { meses: MesRecaudo[] | null; year: number; cargas: number; className?: string }) {
  const hoy = new Date();
  // Meses ya terminados: todos en años pasados, ninguno en años futuros.
  const mesesCerrados = year < hoy.getFullYear() ? 12 : year > hoy.getFullYear() ? 0 : hoy.getMonth();
  const mesEnCurso = year === hoy.getFullYear() ? hoy.getMonth() : -1;

  const datos = meses ?? [];
  const max = Math.max(0, ...datos.flatMap(m => [m.recaudado, m.deuda]));
  const enMillones = max >= 1_000_000;
  const unidad = enMillones ? 1_000_000 : 1_000;
  const { tope, paso } = escalaEje(max / unidad);
  const ticks = [4, 3, 2, 1, 0].map(i => i * paso);

  const atrasado = (m: MesRecaudo, i: number) =>
    i < mesesCerrados && m.deuda > 0 && m.recaudado / m.deuda < UMBRAL_ATRASO;
  const atrasados = datos.map((m, i) => (atrasado(m, i) ? MESES_LARGOS[i] : null)).filter((m): m is string => !!m);
  const enCursoConCobro = mesEnCurso >= 0 && (datos[mesEnCurso]?.deuda ?? 0) > 0;
  const alto = (v: number) => `${Math.min(100, (v / unidad / tope) * 100)}%`;

  return (
    <Tarjeta
      Icono={I.Barras}
      titulo="Recaudo por mes"
      className={className}
      accion={<span className="hidden lg:grid place-items-center size-8 text-white/60"><I.Puntos tam={18} /></span>}
    >
      <div className="flex-1 flex flex-col px-3.5 pt-3.5 pb-3.5 lg:px-5 lg:pt-4 lg:pb-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 lg:gap-x-6 gap-y-1.5">
          <p className="order-last lg:order-none text-[11.5px] lg:text-[13px] text-(--p-suave)">
            {enMillones ? 'Millones' : 'Miles'}<span className="hidden lg:inline"> de pesos · {year}</span>
          </p>
          <ul className="flex items-center gap-2.5 lg:gap-5 text-[11.5px] lg:text-[13px]">
            <li className="flex items-center gap-1.5 lg:gap-2">
              <span className="size-2.5 lg:size-3.5 rounded-full bg-(--p-acento) lg:outline-2 outline-(--p-acento)/40 outline-offset-1" />
              Recaudado
            </li>
            <li className="flex items-center gap-1.5 lg:gap-2">
              <span className="size-2.5 lg:size-3.5 rounded-full bg-(--p-gris) lg:outline-2 outline-(--p-gris)/50 outline-offset-1" />
              Facturado
            </li>
            <li className="flex items-center gap-1.5 lg:gap-2">
              <span className="w-4 h-[2.5px] rounded-full bg-(--p-tinta)" />
              <Corto movil="Atraso">Mes con atraso</Corto>
            </li>
          </ul>
        </div>

        {/* Gráfica (en celular sin eje de valores, para darle el ancho a las barras) */}
        <div className="flex mt-4">
          <div className="hidden lg:block relative w-8 h-[200px] shrink-0">
            {ticks.map((t, i) => (
              <span
                key={t}
                className="absolute right-3 -translate-y-1/2 text-[11px] text-(--p-suave) tabular-nums"
                style={{ top: `${i * 25}%` }}
              >
                {t.toLocaleString('es-CO', { maximumFractionDigits: 1 })}
              </span>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="relative h-[170px] lg:h-[200px]">
              {ticks.slice(0, -1).map((t, i) => (
                <div key={t} className="absolute inset-x-0 border-t border-(--p-borde)" style={{ top: `${i * 25}%` }} />
              ))}
              <div className="absolute inset-x-0 bottom-0 border-t-[1.5px] border-(--p-tinta)/70" />
              <div key={`${year}-${meses ? cargas : 'cargando'}`} className="relative h-full grid grid-cols-12">
                {datos.map((m, i) => (
                  <div
                    key={m.month}
                    className="flex items-end justify-center gap-[3px] lg:gap-1"
                    title={`${MESES_LARGOS[i]}: recaudado ${dineroCorto(m.recaudado)} de ${dineroCorto(m.deuda)}`}
                  >
                    <span className="barra-crece w-[min(14px,36%)] rounded-t-[3px] bg-(--p-acento)" style={{ height: alto(m.recaudado), '--i': i } as CSSProperties} />
                    <span className="barra-crece w-[min(14px,36%)] rounded-t-[3px] bg-(--p-gris)" style={{ height: alto(m.deuda), '--i': i } as CSSProperties} />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-12 mt-2.5">
              {datos.map((m, i) => {
                const marcado = atrasado(m, i);
                return (
                  <div key={m.month} className="flex flex-col items-center">
                    <span className={`text-[10.5px] lg:text-[11px] ${marcado ? 'font-bold text-(--p-tinta)' : 'text-(--p-suave)'}`}>
                      <Corto movil={m.month.charAt(0)}>{m.month}</Corto>
                    </span>
                    {marcado && <span className="mt-1 w-4 h-[2.5px] rounded-full bg-(--p-tinta)" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-auto pt-3 border-t border-(--p-borde) text-[12px] lg:text-[13px] text-(--p-suave)">
          {!meses ? (
            'Cargando…'
          ) : max === 0 ? (
            <>Todavía no hay cuentas de cobro en {year}.</>
          ) : atrasados.length ? (
            <>
              Atrasos en <b className="text-(--p-tinta)">{listaY(atrasados)}</b>
              <span className="hidden lg:inline"> (menos del {UMBRAL_ATRASO * 100}% recaudado)</span>.
            </>
          ) : (
            <>Sin meses atrasados.</>
          )}
          {meses && max > 0 && enCursoConCobro && <> {capitalizar(MESES_LARGOS[mesEnCurso])} sigue en curso.</>}
        </p>
      </div>
    </Tarjeta>
  );
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ── Mayores deudores ──────────────────────────────────────────── */

function MayoresDeudores({ data, onIr }: { data: DashboardData | null; onIr: (s: Seccion) => void }) {
  const deudores = data?.topDeudores ?? [];
  return (
    <Tarjeta
      Icono={I.Billete}
      titulo="Mayores deudores"
      className="min-w-0"
      accion={
        <button
          type="button"
          onClick={() => onIr('deudores')}
          className="shrink-0 h-8 px-2.5 min-[400px]:px-3 rounded-[10px] bg-(--p-acento) text-[#170f27] text-[10.5px] min-[400px]:text-[11.5px] font-bold tracking-[0.1em] min-[400px]:tracking-[0.12em] hover:brightness-105 transition"
        >
          <Corto movil="VER TODO">VER CARTERA</Corto>
        </button>
      }
    >
      {!data ? (
        <p className="px-5 py-6 text-[14px] text-(--p-suave)">Cargando…</p>
      ) : deudores.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-6 text-[14px]">
          <span className="text-(--p-acento)"><I.Check tam={20} /></span>
          Ningún estudiante tiene pagos vencidos.
        </div>
      ) : (
        <ul className="py-1">
          {deudores.map((d, i) => (
            <li
              key={d.identidad}
              className="aparecer-fila flex items-center gap-3 px-4 h-[60px] border-b last:border-b-0 border-(--p-borde)"
              style={{ '--i': i } as CSSProperties}
            >
              <span
                className={`grid place-items-center shrink-0 size-9 rounded-full text-[12px] font-bold ${
                  i === 0 ? 'bg-(--p-acento) text-[#170f27]' : 'bg-(--p-menta)'
                }`}
              >
                {iniciales(d.nombre)}
              </span>
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-[14px] font-semibold truncate">{d.nombre}</p>
                <p className="text-[12px] text-(--p-suave) truncate">
                  {d.grado}<span className="hidden lg:inline"> · Doc. {documento(d.identidad)}</span>
                </p>
              </div>
              <span className="shrink-0 text-[14px] font-bold">{dineroCorto(d.saldo)}</span>
              <button
                type="button"
                onClick={() => onIr('pagos')}
                aria-label={`Ver pagos de ${d.nombre}`}
                className="shrink-0 grid place-items-center size-7 lg:size-8 rounded-full text-(--p-suave) lg:text-current lg:border border-(--p-borde) hover:bg-(--p-hover) transition-colors"
              >
                <I.ChevronDerecha tam={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

/* ── Celular y tablet: últimos pagos ───────────────────────────── */
// La tabla del computador no cabe a lo ancho: cada pago va en una fila con
// estudiante y concepto a la izquierda, monto y fecha a la derecha.

function UltimosPagosMovil({ data, onIr }: { data: DashboardData | null; onIr: (s: Seccion) => void }) {
  const pagos = data?.ultimosPagos ?? [];
  return (
    <Tarjeta
      Icono={I.Tarjeta}
      titulo="Últimos pagos"
      className="min-w-0 lg:hidden"
      accion={
        <button
          type="button"
          onClick={() => onIr('pagos')}
          className="shrink-0 h-8 px-2.5 min-[400px]:px-3 rounded-[10px] bg-(--p-acento) text-[#170f27] text-[10.5px] min-[400px]:text-[11.5px] font-bold tracking-[0.1em] min-[400px]:tracking-[0.12em] hover:brightness-105 transition"
        >
          VER TODO
        </button>
      }
    >
      {!data ? (
        <p className="px-5 py-6 text-[14px] text-(--p-suave)">Cargando…</p>
      ) : pagos.length === 0 ? (
        <p className="px-5 py-6 text-[14px] text-(--p-suave)">Todavía no hay pagos registrados este año.</p>
      ) : (
        <ul className="py-1">
          {pagos.map((p, i) => (
            <li
              key={p.idPago}
              className="aparecer-fila border-b last:border-b-0 border-(--p-borde)"
              style={{ '--i': i } as CSSProperties}
            >
              <button
                type="button"
                onClick={() => onIr('pagos')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-(--p-hover) transition-colors"
              >
                <span className="grid place-items-center shrink-0 size-9 rounded-full bg-(--p-menta) text-[12px] font-bold">
                  {iniciales(p.estudiante)}
                </span>
                <span className="flex-1 min-w-0 leading-tight">
                  <span className="block text-[14px] font-semibold truncate">{p.estudiante}</span>
                  <span className="block mt-0.5 text-[12px] text-(--p-suave) truncate">
                    {capitalizar(p.concepto.toLowerCase())} de {MESES_LARGOS[p.mes - 1] ?? ''}
                  </span>
                </span>
                <span className="shrink-0 text-right leading-tight">
                  <span className="block text-[14px] font-bold">${p.monto.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                  <span className="block mt-0.5 text-[11.5px] text-(--p-suave) whitespace-nowrap">{fechaCorta(p.fecha)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

/* ── Actividad: últimos pagos y grados sin director ────────────── */

type Pestana = 'pagos' | 'grados';

function fechaCorta(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MESES_LARGOS[m - 1].slice(0, 3)} ${y}`;
}

function Actividad({ data, onIr }: { data: DashboardData | null; onIr: (s: Seccion) => void }) {
  const [pestana, setPestana] = useState<Pestana>('pagos');
  const pagos = data?.ultimosPagos ?? [];
  const sinDocente = data?.porGrado.filter(g => !g.docente) ?? [];

  const boton = (id: Pestana, texto: string, cuenta?: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={pestana === id}
      onClick={() => setPestana(id)}
      className={`flex items-center gap-2 h-8 px-3.5 rounded-[10px] text-[11.5px] font-bold tracking-[0.12em] uppercase transition-colors ${
        pestana === id ? 'bg-(--p-acento) text-[#170f27]' : 'text-white/75 hover:text-white'
      }`}
    >
      {texto}
      {!!cuenta && (
        <span className={`grid place-items-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold ${
          pestana === id ? 'bg-[#170f27] text-white' : 'bg-white/15'
        }`}>
          {cuenta}
        </span>
      )}
    </button>
  );

  return (
    <Tarjeta
      Icono={pestana === 'pagos' ? I.Tarjeta : I.Grilla}
      titulo={pestana === 'pagos' ? 'Últimos pagos' : 'Grados sin director de grupo'}
      className="aparecer [--i:3] mt-5"
      accion={
        <div role="tablist" className="flex items-center gap-1 p-1 rounded-[14px] bg-white/10">
          {boton('pagos', 'Últimos pagos')}
          {boton('grados', 'Sin director', sinDocente.length)}
        </div>
      }
    >
      <div key={pestana} className="fundido">
      {!data ? (
        <p className="px-5 py-6 text-[14px] text-(--p-suave)">Cargando…</p>
      ) : pestana === 'pagos' ? (
        pagos.length === 0 ? (
          <p className="px-5 py-6 text-[14px] text-(--p-suave)">Todavía no hay pagos registrados este año.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10.5px] tracking-[0.16em] text-(--p-suave) uppercase">
                <th className="pl-5 py-3 font-semibold">Estudiante</th>
                <th className="py-3 font-semibold">Concepto</th>
                <th className="py-3 font-semibold">Fecha</th>
                <th className="py-3 font-semibold">Método</th>
                <th className="py-3 font-semibold text-right">Monto</th>
                <th className="pr-5 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p, i) => (
                <tr key={p.idPago} className="aparecer-fila border-t border-(--p-borde)" style={{ '--i': i } as CSSProperties}>
                  <td className="pl-5 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid place-items-center shrink-0 size-9 rounded-full bg-(--p-menta) text-[12px] font-bold">
                        {iniciales(p.estudiante)}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <p className="text-[14px] font-semibold truncate">{p.estudiante}</p>
                        <p className="text-[12px] text-(--p-suave) truncate">{p.grado}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 leading-tight">
                    <p className="text-[13.5px] font-medium">{capitalizar(p.concepto.toLowerCase())}</p>
                    <p className="text-[12px] text-(--p-suave)">{capitalizar(MESES_LARGOS[p.mes - 1] ?? '')}</p>
                  </td>
                  <td className="py-2.5 text-[13px] text-(--p-suave) whitespace-nowrap">{fechaCorta(p.fecha)}</td>
                  <td className="py-2.5">
                    <span className="h-6 px-2.5 inline-flex items-center rounded-full bg-(--p-menta) text-[12px] font-semibold">
                      {capitalizar(p.metodo.toLowerCase())}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-[14px] font-bold whitespace-nowrap">
                    ${p.monto.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="pr-5 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onIr('pagos')}
                      className="h-8 px-4 rounded-full bg-(--p-banda) text-white text-[12px] font-bold hover:brightness-125 transition"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : sinDocente.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-6 text-[14px]">
          <span className="text-(--p-acento)"><I.Check tam={20} /></span>
          Todos los grados tienen director de grupo.
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <ul className="flex flex-wrap gap-2">
            {sinDocente.map(g => (
              <li key={g.idGrado} className="h-7 px-3 flex items-center rounded-full bg-(--p-menta) text-[12.5px] font-semibold">
                {nombreGrado(g.nombre, g.jornada)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onIr('docentes')}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-(--p-acento) text-[#170f27] text-[12.5px] font-bold tracking-[0.12em] hover:brightness-105 transition"
          >
            ASIGNAR DOCENTE <I.ChevronDerecha tam={15} />
          </button>
        </div>
      )}
      </div>
    </Tarjeta>
  );
}
