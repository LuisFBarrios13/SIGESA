// src/pages/admin/DocentesPage.tsx — registrar docentes y ver quién dirige cada grupo.
// Diseño: docs/Docentes · Modo claro@1x.png y Docentes · Modo oscuro@1x.png; los diálogos de
// editar y de cambiar grado y jornada, en docs/Docentes · Modal … (claro y oscuro).
// Cambios frente al diseño: la página es para consultar (Docentes registrados, con editar y
// restablecer contraseña, y Directores de grupo, solo lectura); el registro se abre en un
// diálogo con «Registrar docente». Los indicadores separan Mañana y Tarde
// (un docente de jornada completa cuenta en las dos).

import {
  cloneElement, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState,
  type ComponentType, type CSSProperties, type FormEvent, type ReactNode,
} from 'react';
import { clavesApi, docentesApi } from '../../services/api';
import type { DocenteListItem, GradoDisponibilidad } from '../../types/docentes';
import type { Credenciales, JornadaDocente } from '../../types/shared';
import {
  AvisoFlotante, BotonesDialogo, Dialogo, ErrorFormulario, Filtro, PanelFiltros, Progreso, Segmentos, SelectorVista, Tarjeta,
  vistaInicial, type Vista,
} from '../../components/panel';
import { GIRO_MINIMO_MS } from '../../hooks/useDashboard';
import { documento, fechaEncabezado, iniciales, listaY } from '../../utils/formato';
import * as I from '../../components/iconos';

interface Props {
  /** Algo cambió (docente nuevo): el resumen del panel (campanita, Inicio) se vuelve a cargar. */
  onCambio: () => void;
}

type FiltroContacto = '' | 'COMPLETO' | 'SIN_TELEFONO' | 'SIN_CORREO';

interface Form {
  cedula: string; telefono: string; nombre: string; correo: string;
  jornada: JornadaDocente | ''; grado: string;
}
const FORM_VACIO: Form = { cedula: '', telefono: '', nombre: '', correo: '', jornada: '', grado: '' };

/** Un grado con sus dos jornadas (Primero Mañana y Primero Tarde son filas distintas en la base). */
interface FilaGrado { nombre: string; manana?: GradoDisponibilidad; tarde?: GradoDisponibilidad }

const JORNADAS: { valor: JornadaDocente; texto: string; horario: string; Icono: ComponentType<{ tam?: number }> }[] = [
  { valor: 'MAÑANA', texto: 'Mañana', horario: '6:00 a.m. – 12:00 m.', Icono: I.SolRayos },
  { valor: 'TARDE', texto: 'Tarde', horario: '12:00 m. – 6:00 p.m.', Icono: I.Atardecer },
  { valor: 'COMPLETA', texto: 'Completa', horario: '6:00 a.m. – 6:00 p.m.', Icono: I.Sol },
];
const NOMBRE_JORNADA: Record<JornadaDocente, string> = { MAÑANA: 'Mañana', TARDE: 'Tarde', COMPLETA: 'Completa' };

/** Igual que las reglas del servidor. */
const CEDULA_VALIDA = /^[0-9]{3,20}$/;
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_VALIDO = /^[0-9+()\s-]{7,20}$/;

/** Datos de la última visita: al volver a la sección no se ve vacía mientras recarga. */
const cache: { docentes: DocenteListItem[] | null; grados: GradoDisponibilidad[] | null } = { docentes: null, grados: null };

const FILAS_ESQUELETO = 8;
const pct = (parte: number, total: number) => (total > 0 ? Math.min(100, Math.round((parte / total) * 100)) : 0);

function filasPorGrado(grados: GradoDisponibilidad[]): FilaGrado[] {
  // El servidor los manda en orden escolar (Pre Jardín, Jardín, Transición…).
  const filas = new Map<string, FilaGrado>();
  for (const g of grados) {
    const f = filas.get(g.nombre) ?? { nombre: g.nombre };
    if (g.jornada === 'MAÑANA') f.manana = g; else f.tarde = g;
    filas.set(g.nombre, f);
  }
  return [...filas.values()];
}

/** ¿Puede un docente de esta jornada dirigir el grado? Completa: libre en las dos jornadas. */
function libreEn(f: FilaGrado, jornada: JornadaDocente): boolean {
  const libre = (g?: GradoDisponibilidad) => !!g && !g.docente;
  if (jornada === 'MAÑANA') return libre(f.manana);
  if (jornada === 'TARDE') return libre(f.tarde);
  return libre(f.manana) && libre(f.tarde);
}

/** «300 000 0000» si son 10 dígitos; si no, tal cual. */
function telefonoLegible(t: string | null) {
  if (!t) return null;
  const d = t.replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : t;
}

/** Grados que dirige un docente: «Transición» (aunque sean las dos jornadas). */
const gradosDe = (d: DocenteListItem) => listaY([...new Set(d.grados.map(g => g.nombre))]);

export default function DocentesPage({ onCambio }: Props) {
  const [docentes, setDocentes] = useState<DocenteListItem[] | null>(cache.docentes);
  const [grados, setGrados] = useState<GradoDisponibilidad[] | null>(cache.grados);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const [form, setForm] = useState<Form>(FORM_VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  const [registrando, setRegistrando] = useState(false);
  const [q, setQ] = useState('');
  const [fGrado, setFGrado] = useState('');
  const [fJornada, setFJornada] = useState<JornadaDocente | ''>('');
  const [fContacto, setFContacto] = useState<FiltroContacto>('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [vista, setVista] = useState<Vista>(vistaInicial);
  const [editando, setEditando] = useState<DocenteListItem | null>(null);
  const [cambiando, setCambiando] = useState<DocenteListItem | null>(null);
  const [restableciendo, setRestableciendo] = useState<DocenteListItem | null>(null);
  const [aviso, setAviso] = useState('');

  /** Reintentos automáticos seguidos (p. ej. el servidor aún está arrancando). */
  const reintentos = useRef(0);

  useEffect(() => {
    let vigente = true;
    let espera: ReturnType<typeof setTimeout> | undefined;
    let reintento: ReturnType<typeof setTimeout> | undefined;
    const inicio = Date.now();
    setCargando(true);
    Promise.all([docentesApi.listar(), docentesApi.disponibilidad()])
      .then(([ds, gs]) => {
        cache.docentes = ds;
        cache.grados = gs;
        reintentos.current = 0;
        if (vigente) { setDocentes(ds); setGrados(gs); setError(''); }
      })
      .catch(e => {
        if (!vigente) return;
        setError(e instanceof Error ? e.message : 'No se pudieron cargar los docentes.');
        // Al encender el equipo el servidor o la base pueden tardar: se reintenta solo 3 veces.
        if (reintentos.current < 3) {
          reintentos.current++;
          reintento = setTimeout(() => setVersion(v => v + 1), 2000 * reintentos.current);
        }
      })
      .finally(() => {
        // Que el ícono alcance a girar aunque el servidor responda al instante.
        espera = setTimeout(() => { if (vigente) setCargando(false); }, Math.max(0, GIRO_MINIMO_MS - (Date.now() - inicio)));
      });
    return () => { vigente = false; clearTimeout(espera); clearTimeout(reintento); };
  }, [version]);

  const recargar = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const filas = useMemo(() => filasPorGrado(grados ?? []), [grados]);
  const opcionesGrado = form.jornada ? filas.filter(f => libreEn(f, form.jornada as JornadaDocente)).map(f => f.nombre) : [];

  // Grado elegido, solo si sigue libre en la jornada (otro registro o una recarga pudo ocuparlo).
  const grado = opcionesGrado.includes(form.grado) ? form.grado : '';

  /* ── Resumen ─────────────────────────────────────────────────── */
  const conteo = useMemo(() => {
    const ds = docentes ?? [];
    const gs = grados ?? [];
    return {
      total: ds.length,
      manana: ds.filter(d => d.jornada !== 'TARDE').length,
      tarde: ds.filter(d => d.jornada !== 'MAÑANA').length,
      completa: ds.filter(d => d.jornada === 'COMPLETA').length,
      grupos: gs.length,
      libres: gs.filter(g => !g.docente).length,
    };
  }, [docentes, grados]);
  const hayDatos = !!docentes && !!grados;

  /* ── Formulario ──────────────────────────────────────────────── */
  const formulario = useRef<HTMLFormElement>(null);
  const irAlError = useRef(false);

  useEffect(() => {
    if (!irAlError.current) return;
    irAlError.current = false;
    const invalido = formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    invalido?.focus({ preventScroll: true });
    invalido?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [errores]);

  const cambiar = (p: Partial<Form>) => {
    setForm(prev => ({ ...prev, ...p }));
    setErrores(prev => {
      const campos = Object.keys(p).filter(c => c in prev);
      if (!campos.length) return prev;
      const n = { ...prev }; campos.forEach(c => delete n[c]); return n;
    });
  };

  // Al cambiar de jornada el grado se conserva si sigue libre en la nueva (`grado` lo filtra).
  const cambiarJornada = (j: JornadaDocente) => cambiar({ jornada: j });

  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    const cedula = form.cedula.trim();
    if (!cedula) e.cedula = 'Escribe la cédula.';
    else if (!CEDULA_VALIDA.test(cedula)) e.cedula = 'Solo números, sin puntos ni espacios (3 a 20 dígitos).';
    if (form.telefono.trim() && !TELEFONO_VALIDO.test(form.telefono.trim())) e.telefono = 'Revisa el teléfono.';
    if (form.nombre.trim().length < 3) e.nombre = 'Escribe los nombres y apellidos.';
    if (form.correo.trim() && !CORREO_VALIDO.test(form.correo.trim())) e.correo = 'Revisa el correo.';
    if (!form.jornada) e.jornada = 'Elige la jornada.';
    else if (!grado) e.grado = opcionesGrado.length ? 'Elige el grado que va a dirigir.' : 'No hay grados libres en esta jornada.';
    return e;
  }

  async function registrar(ev: FormEvent) {
    ev.preventDefault();
    const e = validar();
    if (Object.keys(e).length) { irAlError.current = true; setErrores(e); return; }
    setEnviando(true);
    setErrorEnvio('');
    const nombre = form.nombre.trim();
    try {
      await docentesApi.crear({
        cedula: form.cedula.trim(),
        nombre,
        telefono: form.telefono.trim() || undefined,
        correo: form.correo.trim() || undefined,
        jornada: form.jornada as JornadaDocente,
        nombreGrado: grado,
      });
      setRegistrando(false);
      setAviso(`${nombre} quedó registrado correctamente como director de ${grado}.`);
      setForm(FORM_VACIO);
      setErrores({});
      recargar();
      onCambio();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo registrar el docente.';
      // Cédula repetida o de otra persona: el error va en su campo.
      if (/c[ée]dula/i.test(msg)) { irAlError.current = true; setErrores({ cedula: msg }); }
      else { setErrorEnvio(msg); recargar(); } // p. ej. el grado se ocupó mientras tanto
    } finally {
      setEnviando(false);
    }
  }

  function limpiar() {
    setForm(FORM_VACIO);
    setErrores({});
    setErrorEnvio('');
  }

  /* ── Lista de docentes ───────────────────────────────────────── */
  const docentesFiltrados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return (docentes ?? []).filter(d =>
      (!texto || d.nombre.toLowerCase().includes(texto) || d.cedula.includes(texto))
      && (!fGrado || d.grados.some(g => g.nombre === fGrado))
      && (!fJornada || d.jornada === fJornada)
      && (!fContacto
        || (fContacto === 'COMPLETO' && !!d.telefono && !!d.correo)
        || (fContacto === 'SIN_TELEFONO' && !d.telefono)
        || (fContacto === 'SIN_CORREO' && !d.correo)));
  }, [docentes, q, fGrado, fJornada, fContacto]);

  const filtrosActivos = [fGrado, fJornada, fContacto].filter(Boolean).length;
  const limpiarFiltros = () => { setFGrado(''); setFJornada(''); setFContacto(''); };

  /** Los mismos filtros en la fila del computador y en el panel del celular. */
  const filtros = (ancho: string) => (
    <>
      <Filtro ancho={ancho} Icono={I.Birrete} etiqueta="Grado" valor={fGrado} onCambio={setFGrado}
        opciones={[['', 'Todos los grados'], ...filas.map(f => [f.nombre, f.nombre] as [string, string])]} />
      <Filtro ancho={ancho} Icono={I.SolRayos} etiqueta="Jornada" valor={fJornada} onCambio={v => setFJornada(v as JornadaDocente | '')}
        opciones={[['', 'Todas las jornadas'], ['MAÑANA', 'Mañana'], ['TARDE', 'Tarde'], ['COMPLETA', 'Completa']]} />
      <Filtro ancho={ancho} Icono={I.Telefono} etiqueta="Contacto" valor={fContacto} onCambio={v => setFContacto(v as FiltroContacto)}
        opciones={[['', 'Todo contacto'], ['COMPLETO', 'Datos completos'], ['SIN_TELEFONO', 'Sin teléfono'], ['SIN_CORREO', 'Sin correo']]} />
    </>
  );


  return (
    <main className="flex-1 flex flex-col">
      {/* Encabezado */}
      <div className="aparecer flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] lg:text-[32px] leading-tight font-extrabold tracking-tight">Docentes</h1>
          <p className="mt-1 text-[10px] lg:text-[11.5px] font-semibold tracking-[0.18em] text-(--p-suave)">{fechaEncabezado()}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2.5">
          <button
            type="button"
            onClick={recargar}
            aria-label="Actualizar datos"
            title="Actualizar datos"
            className="presionable grid place-items-center size-11 rounded-xl border border-(--p-borde) bg-(--p-sup) hover:bg-(--p-hover)"
          >
            <span className={cargando ? 'animate-[spin_0.7s_linear_infinite]' : ''}><I.Recargar tam={18} /></span>
          </button>
          <button
            type="button"
            onClick={() => setRegistrando(true)}
            aria-label="Registrar docente"
            className="presionable h-11 flex items-stretch rounded-xl overflow-hidden bg-(--p-acento) text-[#170f27] hover:brightness-105"
          >
            <span className="grid place-items-center w-11 bg-[rgba(22,12,40,0.12)]"><I.PersonaMas tam={18} /></span>
            <span className="hidden sm:grid place-items-center px-5 text-[12.5px] font-extrabold tracking-[0.14em] uppercase">Registrar docente</span>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-(--p-error)/50 bg-(--p-error)/10 px-5 py-3 text-[14px]">
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
        <Indicador Icono={I.Libro} cuadro="bg-(--p-acento) text-[#170f27]" titulo="Docentes"
          valor={hayDatos ? conteo.total : '—'}
          barra={<Segmentos key={`s-${version}-${hayDatos}`} n={conteo.total} />}
          nota={conteo.completa ? `Registrados · ${conteo.completa} en jornada completa` : 'Registrados'} />
        <Indicador Icono={I.SolRayos} cuadro="bg-(--p-icono) text-(--p-acento)" titulo="Mañana"
          valor={hayDatos ? conteo.manana : '—'}
          barra={<Barra key={`m-${version}-${hayDatos}`} valor={pct(conteo.manana, conteo.total)} />}
          nota={`Jornada · ${conteo.manana} de ${conteo.total} docentes`} />
        <Indicador Icono={I.Atardecer} cuadro="bg-(--p-icono) text-(--p-acento)" titulo="Tarde"
          valor={hayDatos ? conteo.tarde : '—'}
          barra={<Barra key={`t-${version}-${hayDatos}`} valor={pct(conteo.tarde, conteo.total)} oscuro />}
          nota={`Jornada · ${conteo.tarde} de ${conteo.total} docentes`} />
        <Indicador Icono={I.Birrete} cuadro="bg-(--p-icono) text-(--p-acento)" titulo="Grupos libres"
          valor={hayDatos ? `${conteo.libres} de ${conteo.grupos}` : '—'}
          barra={<Barra key={`g-${version}-${hayDatos}`} valor={pct(conteo.libres, conteo.grupos)} />}
          nota={conteo.libres ? <><b className="text-(--p-tinta)">Por asignar</b> · sin director de grupo</> : 'Todos los grupos tienen director'} />
      </section>

      {editando && (
        <DialogoEditar
          docente={editando}
          onCerrar={() => setEditando(null)}
          onListo={msg => { setEditando(null); setAviso(msg); recargar(); }}
        />
      )}
      {cambiando && (
        <DialogoCambiarGrado
          docente={cambiando}
          docentes={docentes ?? []}
          filas={filas}
          onCerrar={() => setCambiando(null)}
          onListo={msg => { setCambiando(null); setAviso(msg); recargar(); onCambio(); }}
        />
      )}
      {restableciendo && <DialogoRestablecer docente={restableciendo} onCerrar={() => setRestableciendo(null)} />}
      {aviso && <AvisoFlotante texto={aviso} onCerrar={() => setAviso('')} />}

      {registrando && (
        <Dialogo titulo="Registrar docente" ancho="max-w-[620px]" borde={false} onCerrar={() => setRegistrando(false)}>
          <form ref={formulario} onSubmit={registrar} noValidate>
          {/* Un solo aviso para el lector de pantalla; cada error se lee al llegar a su campo. */}
          <p className="sr-only" aria-live="polite">
            {Object.keys(errores).length === 1 ? 'Hay un campo por corregir.' : Object.keys(errores).length > 1 ? `Hay ${Object.keys(errores).length} campos por corregir.` : ''}
          </p>

          <div className="mt-4 grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <Campo etiqueta="Cédula" requerido error={errores.cedula}>
              <input value={form.cedula} onChange={e => cambiar({ cedula: e.target.value.replace(/\s/g, '') })}
                inputMode="numeric" autoComplete="off" placeholder="Número de cédula" maxLength={20}
                aria-invalid={!!errores.cedula || undefined} className={claseCampo} />
            </Campo>
            <Campo etiqueta="Teléfono" error={errores.telefono}>
              <input value={form.telefono} onChange={e => cambiar({ telefono: e.target.value })}
                type="tel" inputMode="tel" autoComplete="off" placeholder="300 000 0000" maxLength={20}
                aria-invalid={!!errores.telefono || undefined} className={claseCampo} />
            </Campo>
            <Campo etiqueta="Nombre completo" requerido error={errores.nombre} className="sm:col-span-2">
              <input value={form.nombre} onChange={e => cambiar({ nombre: e.target.value })}
                autoComplete="off" placeholder="Nombres y apellidos" maxLength={150}
                aria-invalid={!!errores.nombre || undefined} className={claseCampo} />
            </Campo>
            <Campo etiqueta="Correo electrónico" error={errores.correo} className="sm:col-span-2">
              <input value={form.correo} onChange={e => cambiar({ correo: e.target.value })}
                type="email" autoComplete="off" placeholder="correo@ejemplo.com" maxLength={100}
                aria-invalid={!!errores.correo || undefined} className={claseCampo} />
            </Campo>
          </div>

          <SelectorJornada valor={form.jornada} onCambio={cambiarJornada} error={errores.jornada} />

          <Campo
            etiqueta="Grado a dirigir"
            requerido
            className="mt-4"
            error={errores.grado}
            ayuda={
              !form.jornada ? 'Primero elige la jornada del docente.'
                : !hayDatos ? 'Cargando grados…'
                  : !opcionesGrado.length ? 'No hay grados libres en esta jornada.'
                    : form.jornada === 'COMPLETA' ? 'Solo aparecen los grados sin director en ninguna jornada.'
                      : `Solo aparecen los grados sin director en la ${form.jornada === 'MAÑANA' ? 'mañana' : 'tarde'}.`
            }
          >
            {describedBy => <span className="relative block">
              <select value={grado} onChange={e => cambiar({ grado: e.target.value })}
                disabled={!form.jornada || !opcionesGrado.length}
                aria-invalid={!!errores.grado || undefined} aria-describedby={describedBy}
                className={`${claseCampo} appearance-none pr-10 cursor-pointer disabled:cursor-not-allowed disabled:bg-(--p-menta) disabled:text-(--p-tenue)`}>
                <option value="">{form.jornada && hayDatos && !opcionesGrado.length ? 'Sin grados libres' : 'Selecciona un grado'}</option>
                {opcionesGrado.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-(--p-suave)"><I.ChevronAbajo tam={16} /></span>
            </span>}
          </Campo>
          <ErrorFormulario texto={errorEnvio} />
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={limpiar}
                className="presionable h-11 px-5 rounded-xl border border-(--p-borde) text-[14px] font-bold hover:bg-(--p-hover)">
                Limpiar
              </button>
              <button type="submit" disabled={enviando}
                className="presionable max-sm:flex-1 h-11 px-5 rounded-xl bg-(--p-acento) text-[#160c28] text-[12.5px] font-extrabold tracking-[0.12em] uppercase whitespace-nowrap hover:brightness-105 disabled:opacity-60">
                {enviando ? 'Registrando…' : 'Registrar'}
              </button>
            </div>
          </form>
        </Dialogo>
      )}

      <div className="mt-5 flex flex-col gap-4 lg:gap-5">
        {/* ── Docentes registrados ── */}
        <Tarjeta Icono={I.Persona} titulo="Docentes registrados" className="aparecer [--i:2]"
          accion={<SelectorVista vista={vista} onCambio={setVista} />}>
          <div className="flex flex-wrap items-center gap-2.5 lg:gap-3 p-3 min-[400px]:p-4 border-b border-(--p-borde)">
            <label className="flex-1 min-w-0 lg:min-w-[240px] flex items-center gap-3 h-11 px-4 rounded-xl border border-(--p-borde) focus-within:border-(--p-acento) transition-colors">
              <span className="text-(--p-suave)"><I.Buscar tam={17} /></span>
              <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Nombre o cédula"
                aria-label="Buscar docente por nombre o cédula"
                className="flex-1 min-w-0 bg-transparent text-[14px] outline-none placeholder:text-(--p-suave)" />
            </label>
            {/* Celular y tablet: los filtros van en un panel aparte, como en Estudiantes */}
            <button type="button" onClick={() => setFiltrosAbiertos(true)}
              className="lg:hidden flex items-center gap-2 h-11 px-4 rounded-xl bg-(--p-banda) text-white text-[13.5px] font-bold hover:brightness-125">
              <span className="text-(--p-acento)"><I.Filtros tam={17} /></span>
              Filtros
              {filtrosActivos > 0 && (
                <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-(--p-acento) text-[#170f27] text-[11px] font-bold">
                  {filtrosActivos}
                </span>
              )}
            </button>
            <div className="hidden lg:contents">{filtros('w-[200px]')}</div>
          </div>
          {filtrosAbiertos && (
            <PanelFiltros activos={filtrosActivos} resultados={docentesFiltrados.length} unidad={['docente', 'docentes']}
              onLimpiar={limpiarFiltros} onCerrar={() => setFiltrosAbiertos(false)}>
              {filtros('w-full')}
            </PanelFiltros>
          )}
          {error && !docentes ? <ErrorCarga cargando={cargando} error={error} onReintentar={() => { reintentos.current = 0; recargar(); }} /> : (
            <ListaDocentes
              vista={vista}
              docentes={docentesFiltrados}
              cargando={!docentes}
              hayDocentes={!!docentes?.length}
              onEditar={setEditando}
              onCambiarGrado={setCambiando}
              onRestablecer={setRestableciendo}
            />
          )}
        </Tarjeta>

        {/* ── Directores de grupo (solo consulta) ── */}
        <Tarjeta Icono={I.Birrete} titulo="Directores de grupo por grado y jornada" className="aparecer [--i:3]">
          {error && !grados ? <ErrorCarga cargando={cargando} error={error} onReintentar={() => { reintentos.current = 0; recargar(); }} /> : (
            <>
              <TablaGrupos filas={filas} cargando={!grados} />
              <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 sm:px-5 py-3.5 border-t border-(--p-borde) text-[12.5px] text-(--p-suave)">
                <span className="flex items-center gap-2">
                  <ChipLibre />
                  <span>sin director · <b className="text-(--p-tinta)">{conteo.libres} de {conteo.grupos}</b> grupos por asignar</span>
                </span>
              </footer>
            </>
          )}
        </Tarjeta>
      </div>
    </main>
  );
}

/* ── Indicadores ───────────────────────────────────────────────── */

function Indicador({ Icono, cuadro, titulo, valor, barra, nota }: {
  Icono: ComponentType<{ tam?: number }>; cuadro: string; titulo: string;
  valor: number | string; barra: ReactNode; nota: ReactNode;
}) {
  return (
    <div className="min-w-0 px-3 min-[400px]:px-3.5 pt-3.5 pb-4 lg:px-[22px] lg:pt-5 lg:pb-[22px]
                    max-lg:rounded-[20px] max-lg:bg-(--p-sup) max-lg:border max-lg:border-(--p-borde) transition-colors">
      <div className="flex items-center gap-1.5 min-[420px]:gap-2 lg:gap-3">
        <span className={`grid place-items-center shrink-0 size-6 min-[420px]:size-7 lg:size-9 rounded-lg lg:rounded-[10px] [&>svg]:size-[15px] lg:[&>svg]:size-[18px] ${cuadro}`}><Icono tam={18} /></span>
        <p className="flex-1 min-w-0 text-[9px] min-[420px]:text-[9.5px] lg:text-[11.5px] font-semibold tracking-[0.06em] min-[420px]:tracking-[0.12em] lg:tracking-[0.16em] uppercase text-(--p-suave) truncate">{titulo}</p>
      </div>
      <p className="mt-2.5 lg:mt-3 text-[24px] lg:text-[31px] leading-none font-extrabold tracking-tight">{valor}</p>
      <div className="mt-3.5 lg:mt-4">{barra}</div>
      <p className="mt-2.5 lg:mt-3 text-[11.5px] lg:text-[13px] text-(--p-suave) truncate">{nota}</p>
    </div>
  );
}

function Barra({ valor, oscuro = false }: { valor: number; oscuro?: boolean }) {
  if (valor <= 0) return <div className="h-[5px] rounded-full bg-(--p-menta)" />;
  return (
    <Progreso
      valor={valor}
      relleno={oscuro ? 'bg-(--p-linea)' : 'bg-(--p-acento)'}
      borde={oscuro ? 'border-(--p-linea)' : 'border-(--p-acento)'}
    />
  );
}

/* ── Campos ────────────────────────────────────────────────────── */

const claseCampo =
  'w-full h-12 px-4 rounded-xl border border-(--p-borde) bg-(--p-campo) text-[14.5px] outline-none transition-colors ' +
  'placeholder:text-(--p-tenue) focus:border-(--p-foco) focus:ring-3 focus:ring-(--p-foco)/20 aria-invalid:border-(--p-error)';

const claseEtiqueta = 'block mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)';

/** `children` puede ser una función que recibe el id de la nota (para un control envuelto). */
function Campo({ etiqueta, requerido = false, error, ayuda, className = '', children }: {
  etiqueta: string; requerido?: boolean; error?: string; ayuda?: string; className?: string;
  children: ReactNode | ((describedBy: string | undefined) => ReactNode);
}) {
  const idNota = useId();
  const describedBy = error || ayuda ? idNota : undefined;
  // El error (o la ayuda) se lee al llegar al campo, no como parte de su nombre.
  const control = typeof children === 'function'
    ? children(describedBy)
    : describedBy && isValidElement<{ 'aria-describedby'?: string }>(children)
      ? cloneElement(children, { 'aria-describedby': describedBy })
      : children;
  return (
    <div className={`block min-w-0 ${className}`}>
      <label className="block">
        <span className={claseEtiqueta}>{etiqueta}{requerido && <span className="text-(--p-tinta)"> *</span>}</span>
        {control}
      </label>
      {error
        ? <span id={idNota} className="revelar-error flex items-center gap-1.5 mt-1.5 text-[12.5px] font-medium text-(--p-error)">{error}</span>
        : ayuda && (
          <span id={idNota} className="flex items-center gap-1.5 mt-1.5 text-[12.5px] text-(--p-suave)">
            <span className="shrink-0 grid place-items-center size-3.5 rounded-full border border-current text-[9px] font-bold leading-none">i</span>
            {ayuda}
          </span>
        )}
    </div>
  );
}

/** Tres tarjetas (Mañana, Tarde, Completa). Son radios nativos: Tab entra y las flechas cambian. */
function SelectorJornada({ valor, onCambio, error }: { valor: JornadaDocente | ''; onCambio: (j: JornadaDocente) => void; error?: string }) {
  const idError = useId();
  const nombre = useId();
  return (
    <fieldset className="mt-4 min-w-0">
      <legend className={claseEtiqueta}>Jornada laboral<span className="text-(--p-tinta)"> *</span></legend>
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {JORNADAS.map(({ valor: v, texto, horario, Icono }, i) => (
          <label key={v}
            className={`group relative min-w-0 flex flex-col gap-1 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-colors
                        hover:bg-(--p-hover) has-checked:bg-(--p-acento)/15 has-checked:border-(--p-acento)
                        has-focus-visible:ring-3 has-focus-visible:ring-(--p-foco)/30
                        ${error ? 'border-(--p-error)' : 'border-(--p-borde)'}`}>
            <input type="radio" name={nombre} value={v} checked={valor === v} onChange={() => onCambio(v)}
              aria-invalid={(i === 0 && !!error) || undefined} aria-describedby={error ? idError : undefined}
              className="sr-only" />
            <span className="grid place-items-center size-8 mb-1 rounded-lg bg-(--p-menta) text-(--p-tinta) transition-colors
                             group-has-checked:bg-(--p-acento) group-has-checked:text-[#170f27]"><Icono tam={16} /></span>
            <span className="text-[14px] font-bold">{texto}</span>
            <span className="text-[11px] sm:text-[12px] leading-snug text-(--p-suave)">{horario}</span>
            {valor === v && <span className="absolute top-2 right-2 text-(--p-tinta)"><I.CheckCirculo tam={16} /></span>}
          </label>
        ))}
      </div>
      {error && <span id={idError} className="revelar-error block mt-1.5 text-[12.5px] font-medium text-(--p-error)">{error}</span>}
    </fieldset>
  );
}

/* ── Piezas pequeñas ───────────────────────────────────────────── */

/** Sin datos y con error: se dice en la tarjeta (no un relleno gris que nunca termina). */
function ErrorCarga({ cargando, error, onReintentar }: { cargando: boolean; error: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="px-5 py-10 text-center">
      <p className="text-[15px] font-semibold">No se pudieron cargar los datos</p>
      <p className="mt-1 text-[13px] text-(--p-suave)">{cargando ? 'Intentando de nuevo…' : error}</p>
      <button type="button" onClick={onReintentar} disabled={cargando}
        className="presionable mt-4 h-10 px-5 rounded-xl bg-(--p-acento) text-[#170f27] text-[12.5px] font-bold tracking-[0.12em] uppercase disabled:opacity-60">
        Reintentar
      </button>
    </div>
  );
}

function Avatar({ nombre, tam = 'size-8', letra = 'text-[11.5px]' }: { nombre: string; tam?: string; letra?: string }) {
  return (
    <span className={`grid place-items-center shrink-0 ${tam} rounded-full bg-(--p-acento) text-[#170f27] ${letra} font-bold`}>
      {iniciales(nombre)}
    </span>
  );
}

function ChipLibre() {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[9px] bg-(--p-menta) text-(--p-tinta) text-[12.5px] font-bold">
      <I.CheckCirculo tam={14} /> Libre
    </span>
  );
}

function ChipJornada({ jornada }: { jornada: JornadaDocente }) {
  const { Icono } = JORNADAS.find(j => j.valor === jornada)!;
  const clase = jornada === 'MAÑANA' ? 'manana' : jornada === 'TARDE' ? 'tarde' : 'completa';
  return (
    <span className={`chip-jornada ${clase} inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[9px] text-[12px] font-bold whitespace-nowrap`}>
      <span className="icono inline-flex"><Icono tam={13} /></span>
      {NOMBRE_JORNADA[jornada]}
    </span>
  );
}

/** Director de un grado en una jornada, o «Libre». */
function Director({ g }: { g?: GradoDisponibilidad }) {
  if (!g) return <span className="text-(--p-tenue)">—</span>;
  if (!g.docente) return <ChipLibre />;
  return (
    <span className="flex items-center gap-2.5 min-w-0">
      <Avatar nombre={g.docente.nombre} />
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold">{g.docente.nombre}</span>
        {g.docente.jornada === 'COMPLETA' && <span className="block text-[11.5px] text-(--p-suave)">Jornada completa</span>}
      </span>
    </span>
  );
}

/* ── Tabla de grupos ───────────────────────────────────────────── */

/** Solo consulta: quién dirige cada grado en cada jornada. El grado se asigna al registrar. */
function TablaGrupos({ filas, cargando }: { filas: FilaGrado[]; cargando: boolean }) {
  if (!cargando && !filas.length) {
    return <p className="px-5 py-10 text-center text-[14px] text-(--p-suave)">No hay grados creados.</p>;
  }

  return (
    <>
      {/* Tableta y computador */}
      <table className="hidden sm:table w-full table-fixed text-left">
        <colgroup>
          <col className="w-[22%]" />
          <col />
          <col />
        </colgroup>
        <thead className="bg-(--p-menta)/60">
          <tr className="text-[10.5px] tracking-[0.16em] text-(--p-suave) uppercase">
            <th className="pl-5 py-3 font-semibold">Grado</th>
            <th className="py-3 font-semibold"><span className="inline-flex items-center gap-1.5"><I.SolRayos tam={14} /> Mañana</span></th>
            <th className="pr-5 py-3 font-semibold"><span className="inline-flex items-center gap-1.5"><I.Atardecer tam={14} /> Tarde</span></th>
          </tr>
        </thead>
        <tbody>
          {cargando && Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
            <tr key={i} className="border-t border-(--p-borde)" aria-hidden>
              <td className="pl-5 py-4"><span className="block h-3 w-2/3 rounded-full esqueleto" /></td>
              <td className="py-4 pr-4"><span className="block h-3 w-3/4 rounded-full esqueleto" /></td>
              <td className="py-4 pr-5"><span className="block h-3 w-3/4 rounded-full esqueleto" /></td>
            </tr>
          ))}
          {!cargando && filas.map((f, i) => (
            <tr key={f.nombre} style={{ '--i': Math.min(i, 12) } as CSSProperties}
              className="aparecer-fila border-t border-(--p-borde) transition-colors hover:bg-(--p-hover)/60">
              <th scope="row" className="pl-5 py-3 text-[14.5px] font-bold">{f.nombre}</th>
              <td className="py-3 pr-4"><Director g={f.manana} /></td>
              <td className="py-3 pr-5"><Director g={f.tarde} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Celular: una tarjeta por grado */}
      <ul className="sm:hidden divide-y divide-(--p-borde)">
        {cargando && Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="px-4 py-4 space-y-3" aria-hidden>
            <span className="block h-3.5 w-1/3 rounded-full esqueleto" />
            <span className="block h-3 w-2/3 rounded-full esqueleto" />
            <span className="block h-3 w-2/3 rounded-full esqueleto" />
          </li>
        ))}
        {!cargando && filas.map(f => (
          <li key={f.nombre} className="px-4 py-3.5">
            <p className="text-[15px] font-bold">{f.nombre}</p>
            <dl className="mt-2.5 grid grid-cols-[78px_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
              <dt className="flex items-center gap-1.5 text-[12px] font-semibold text-(--p-suave)"><I.SolRayos tam={13} /> Mañana</dt>
              <dd className="min-w-0"><Director g={f.manana} /></dd>
              <dt className="flex items-center gap-1.5 text-[12px] font-semibold text-(--p-suave)"><I.Atardecer tam={13} /> Tarde</dt>
              <dd className="min-w-0"><Director g={f.tarde} /></dd>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ── Lista de docentes ─────────────────────────────────────────── */

function BotonIcono({ etiqueta, onClick, children }: { etiqueta: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={etiqueta} title={etiqueta}
      className="presionable grid place-items-center size-9 rounded-[10px] border border-(--p-borde) hover:bg-(--p-hover)">
      {children}
    </button>
  );
}

function ListaDocentes({ vista, docentes, cargando, hayDocentes, onEditar, onCambiarGrado, onRestablecer }: {
  vista: Vista; docentes: DocenteListItem[]; cargando: boolean; hayDocentes: boolean;
  onEditar: (d: DocenteListItem) => void; onCambiarGrado: (d: DocenteListItem) => void; onRestablecer: (d: DocenteListItem) => void;
}) {
  if (cargando) {
    return (
      <div className="px-5 py-4 space-y-4" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="size-9 shrink-0 rounded-full esqueleto" />
            <span className="flex-1 space-y-1.5"><span className="block h-3 w-1/2 rounded-full esqueleto" /><span className="block h-3 w-1/3 rounded-full esqueleto" /></span>
          </div>
        ))}
      </div>
    );
  }
  if (!docentes.length) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-[15px] font-semibold">{hayDocentes ? 'No hay docentes que coincidan' : 'Aún no hay docentes registrados'}</p>
        <p className="mt-1 text-[13px] text-(--p-suave)">{hayDocentes ? 'Prueba con otro nombre o quita algún filtro.' : 'Usa «Registrar docente» para agregar el primero.'}</p>
      </div>
    );
  }

  const acciones = (d: DocenteListItem) => (
    <div className="flex justify-end gap-2">
      <BotonIcono etiqueta={`Editar datos de ${d.nombre}`} onClick={() => onEditar(d)}><I.Lapiz tam={15} /></BotonIcono>
      <BotonIcono etiqueta={`Cambiar grado y jornada de ${d.nombre}`} onClick={() => onCambiarGrado(d)}><I.Birrete tam={16} /></BotonIcono>
      <BotonIcono etiqueta={`Restablecer contraseña de ${d.nombre}`} onClick={() => onRestablecer(d)}><I.Llave tam={16} /></BotonIcono>
    </div>
  );

  if (vista === 'tarjetas') {
    return (
      <ul className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-4 sm:p-4">
        {docentes.map((d, i) => (
          <TarjetaDocente key={d.cedula} indice={i} d={d}
            onEditar={() => onEditar(d)} onCambiarGrado={() => onCambiarGrado(d)} onRestablecer={() => onRestablecer(d)} />
        ))}
      </ul>
    );
  }

  return (
    <>
      {/* Tableta y computador */}
      <table className="hidden sm:table w-full table-fixed text-left">
        <colgroup>
          <col />
          <col className="w-[26%]" />
          <col className="w-[14%]" />
          <col className="w-[15%]" />
          <col className="w-[150px]" />
        </colgroup>
        <thead className="bg-(--p-menta)/60">
          <tr className="text-[10.5px] tracking-[0.16em] text-(--p-suave) uppercase">
            <th className="pl-5 py-3 font-semibold">Docente</th>
            <th className="py-3 font-semibold">Contacto</th>
            <th className="py-3 font-semibold">Grado</th>
            <th className="py-3 font-semibold">Jornada</th>
            <th className="pr-5 py-3 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {docentes.map((d, i) => (
            <tr key={d.cedula} style={{ '--i': Math.min(i, 12) } as CSSProperties} className="aparecer-fila border-t border-(--p-borde) hover:bg-(--p-hover)/60">
              <td className="pl-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar nombre={d.nombre} tam="size-9" />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">{d.nombre}</p>
                    <p className="truncate text-[12.5px] text-(--p-suave)">CC {documento(d.cedula)}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-[13px]">
                <p className="truncate">{telefonoLegible(d.telefono) ?? <span className="text-(--p-tenue)">Sin teléfono</span>}</p>
                <p className="truncate text-(--p-suave)">{d.correo ?? <span className="text-(--p-tenue)">Sin correo</span>}</p>
              </td>
              <td className="py-3 pr-4 text-[14px] font-semibold truncate">
                {d.grados.length ? gradosDe(d) : <span className="font-normal text-(--p-tenue)">Sin grado</span>}
              </td>
              <td className="py-3 pr-4"><ChipJornada jornada={d.jornada} /></td>
              <td className="pr-5 py-3">{acciones(d)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Celular */}
      <ul className="sm:hidden divide-y divide-(--p-borde)">
        {docentes.map(d => (
          <li key={d.cedula} className="px-4 py-3.5">
            <div className="flex items-start gap-3">
              <Avatar nombre={d.nombre} tam="size-9" />
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-semibold leading-snug">{d.nombre}</p>
                <p className="text-[12.5px] text-(--p-suave)">CC {documento(d.cedula)}</p>
              </div>
              {acciones(d)}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px]">
              <ChipJornada jornada={d.jornada} />
              <span className="font-semibold">{d.grados.length ? gradosDe(d) : 'Sin grado'}</span>
            </div>
            {(d.telefono || d.correo) && (
              <p className="mt-2 text-[13px] text-(--p-suave) break-words">
                {[telefonoLegible(d.telefono), d.correo].filter(Boolean).join(' · ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/* ── Tarjeta del docente (vista Tarjetas, como la de Estudiantes) ── */

function TarjetaDocente({ indice, d, onEditar, onCambiarGrado, onRestablecer }: {
  indice: number; d: DocenteListItem;
  onEditar: () => void; onCambiarGrado: () => void; onRestablecer: () => void;
}) {
  return (
    <li className="aparecer-fila min-w-0 p-4 min-[400px]:p-5 max-sm:border-b max-sm:last:border-b-0 border-(--p-borde) sm:rounded-[18px] sm:border"
      style={{ '--i': Math.min(indice, 12) } as CSSProperties}>
      <div className="flex items-center gap-3">
        <Avatar nombre={d.nombre} tam="size-11" letra="text-[13px]" />
        <span className="min-w-0 leading-tight">
          <span className="block text-[16px] font-bold truncate">{d.nombre}</span>
          <span className="block mt-0.5 text-[12.5px] text-(--p-suave) truncate">CC {documento(d.cedula)}</span>
        </span>
      </div>

      <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-2xl bg-(--p-menta) px-3.5 py-3">
        <DatoTarjeta etiqueta="Grado">{d.grados.length ? gradosDe(d) : 'Sin grado'}</DatoTarjeta>
        <DatoTarjeta etiqueta="Jornada"><ChipJornada jornada={d.jornada} /></DatoTarjeta>
        <DatoTarjeta etiqueta="Teléfono">{telefonoLegible(d.telefono) ?? <span className="font-normal text-(--p-tenue)">Sin teléfono</span>}</DatoTarjeta>
        <DatoTarjeta etiqueta="Correo">{d.correo ?? <span className="font-normal text-(--p-tenue)">Sin correo</span>}</DatoTarjeta>
      </dl>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <AccionTarjeta etiqueta="Editar" onClick={onEditar}><I.Lapiz tam={16} /></AccionTarjeta>
        <AccionTarjeta etiqueta="Grado" titulo="Cambiar grado y jornada" onClick={onCambiarGrado}><I.Birrete tam={16} /></AccionTarjeta>
        <AccionTarjeta etiqueta="Clave" titulo="Restablecer clave (contraseña)" onClick={onRestablecer}><I.Llave tam={16} /></AccionTarjeta>
      </div>
    </li>
  );
}

function DatoTarjeta({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">{etiqueta}</dt>
      <dd className="mt-0.5 text-[14px] font-bold truncate">{children}</dd>
    </div>
  );
}

function AccionTarjeta({ etiqueta, titulo, onClick, children }: { etiqueta: string; titulo?: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={titulo} aria-label={titulo}
      className="presionable min-w-0 flex items-center justify-center gap-2 h-11 rounded-xl border border-(--p-borde) bg-(--p-sup)
                 text-[13.5px] font-semibold hover:bg-(--p-hover)">
      {children}
      <span className="truncate">{etiqueta}</span>
    </button>
  );
}

/* ── Diálogos ──────────────────────────────────────────────────── */

function Credencial({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-[14px] bg-(--p-menta) px-4 py-3">
      <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">{etiqueta}</p>
      <p className="mt-0.5 font-mono text-[17px] font-bold tracking-wide select-all">{valor}</p>
    </div>
  );
}

function Credenciales({ c }: { c: Pick<Credenciales, 'username' | 'passwordTemporal'> }) {
  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Credencial etiqueta="Usuario" valor={c.username} />
        <Credencial etiqueta="Contraseña" valor={c.passwordTemporal} />
      </div>
      <p className="mt-3 text-[12.5px] text-(--p-suave)">Debe cambiar la contraseña la primera vez que entre al sistema.</p>
    </>
  );
}

function BotonListo({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-6 flex justify-end">
      <button type="button" onClick={onClick} autoFocus
        className="h-10 px-6 rounded-xl bg-(--p-acento) text-[#170f27] text-[12.5px] font-bold tracking-[0.12em] uppercase">
        Listo
      </button>
    </div>
  );
}


/** Cancelar y la acción principal, mitad y mitad, como en los diseños de los modales de docentes. */
function BotonesFicha({ onCancelar, texto, textoEnviando, Icono, enviando, deshabilitado = false }: {
  onCancelar: () => void; texto: string; textoEnviando: string; Icono: ComponentType<{ tam?: number }>;
  enviando: boolean; deshabilitado?: boolean;
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      <button type="button" onClick={onCancelar}
        className="presionable h-12 rounded-xl border border-(--p-borde) bg-(--p-campo) text-[14px] font-bold hover:bg-(--p-hover)">
        Cancelar
      </button>
      <button type="submit" disabled={enviando || deshabilitado}
        className="presionable h-12 flex items-stretch overflow-hidden rounded-xl bg-(--p-acento) text-[#160c28] hover:brightness-105
                   disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:brightness-100">
        <span className="w-12 flex-none grid place-items-center bg-[rgba(22,12,40,0.12)]"><Icono tam={17} /></span>
        <span className="flex-1 grid place-items-center px-3 text-[12px] sm:text-[12.5px] font-extrabold tracking-[0.14em] uppercase whitespace-nowrap">
          {enviando ? textoEnviando : texto}
        </span>
      </button>
    </div>
  );
}

const avatarDialogo = (nombre: string) => <Avatar nombre={nombre} tam="size-12" letra="text-[14px]" />;

function DialogoEditar({ docente, onCerrar, onListo }: {
  docente: DocenteListItem; onCerrar: () => void; onListo: (msg: string) => void;
}) {
  const [nombre, setNombre] = useState(docente.nombre);
  const [telefono, setTelefono] = useState(docente.telefono ?? '');
  const [correo, setCorreo] = useState(docente.correo ?? '');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (nombre.trim().length < 3) e.nombre = 'Escribe los nombres y apellidos.';
    if (telefono.trim() && !TELEFONO_VALIDO.test(telefono.trim())) e.telefono = 'Revisa el teléfono.';
    if (correo.trim() && !CORREO_VALIDO.test(correo.trim())) e.correo = 'Revisa el correo.';
    setErrores(e);
    if (Object.keys(e).length) return;
    setEnviando(true);
    setError('');
    try {
      await docentesApi.actualizar(docente.cedula, { nombre: nombre.trim(), telefono: telefono.trim(), correo: correo.trim() });
      onListo(`Se actualizaron los datos de ${nombre.trim()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.');
      setEnviando(false);
    }
  }

  return (
    <Dialogo titulo="Editar docente" ancho="max-w-[600px]" borde={false} onCerrar={onCerrar}
      avatar={avatarDialogo(docente.nombre)}
      subtitulo={<>CC {documento(docente.cedula)} · {NOMBRE_JORNADA[docente.jornada]}{docente.grados.length > 0 && ` · Dirige ${gradosDe(docente)}`}</>}>
      <form onSubmit={enviar} noValidate>
        <div className="space-y-4">
          <Campo etiqueta="Nombre completo" requerido error={errores.nombre}>
            <input value={nombre} onChange={e => setNombre(e.target.value)} maxLength={150} autoComplete="off"
              aria-invalid={!!errores.nombre || undefined} className={claseCampo} />
          </Campo>
          <Campo etiqueta="Teléfono" error={errores.telefono}>
            <input value={telefono} onChange={e => setTelefono(e.target.value)} type="tel" inputMode="tel" maxLength={20} autoComplete="off"
              placeholder="300 000 0000" aria-invalid={!!errores.telefono || undefined} className={claseCampo} />
          </Campo>
          <Campo etiqueta="Correo electrónico" error={errores.correo}>
            <input value={correo} onChange={e => setCorreo(e.target.value)} type="email" maxLength={100} autoComplete="off"
              placeholder="correo@ejemplo.com" aria-invalid={!!errores.correo || undefined} className={claseCampo} />
          </Campo>
        </div>
        <ErrorFormulario texto={error} />
        <BotonesFicha onCancelar={onCerrar} texto="Guardar cambios" textoEnviando="Guardando…" Icono={I.Check} enviando={enviando} />
      </form>
    </Dialogo>
  );
}

/** «Primero · Mañana», «Transición · Completa». */
const asignacionDe = (d: DocenteListItem) =>
  `${d.grados.length ? gradosDe(d) : 'Sin grado'} · ${NOMBRE_JORNADA[d.jornada]}`;

type ModoCambio = 'mover' | 'intercambiar';

const MODOS: { valor: ModoCambio; texto: string; Icono: ComponentType<{ tam?: number }> }[] = [
  { valor: 'mover', texto: 'Mover a un grado libre', Icono: I.Mover },
  { valor: 'intercambiar', texto: 'Intercambiar con otro', Icono: I.Intercambiar },
];

function DialogoCambiarGrado({ docente, docentes, filas, onCerrar, onListo }: {
  docente: DocenteListItem; docentes: DocenteListItem[]; filas: FilaGrado[];
  onCerrar: () => void; onListo: (msg: string) => void;
}) {
  const [modo, setModo] = useState<ModoCambio>('mover');
  const [jornada, setJornada] = useState<JornadaDocente | ''>('');
  const [gradoElegido, setGradoElegido] = useState('');
  const [con, setCon] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const idNota = useId();

  // Los grados que hoy tiene este docente cuentan como libres: puede quedarse en su grado con otra jornada.
  const filasSinEl = useMemo(() => {
    const soltar = (g?: GradoDisponibilidad) => g?.docente?.cedula === docente.cedula ? { ...g, docente: null } : g;
    return filas.map(f => ({ ...f, manana: soltar(f.manana), tarde: soltar(f.tarde) }));
  }, [filas, docente.cedula]);
  const actual = docente.grados[0]?.nombre;
  const opciones = jornada
    ? filasSinEl.filter(f => libreEn(f, jornada) && !(jornada === docente.jornada && f.nombre === actual)).map(f => f.nombre)
    : [];
  const grado = opciones.includes(gradoElegido) ? gradoElegido : '';

  const otros = docentes.filter(d => d.cedula !== docente.cedula && d.grados.length);
  const otro = otros.find(d => d.cedula === con);
  const listo = modo === 'mover' ? !!jornada && !!grado : !!otro;

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    if (!listo) return;
    setEnviando(true);
    setError('');
    try {
      if (modo === 'mover') {
        const j = jornada as JornadaDocente;
        await docentesApi.cambiarAsignacion(docente.cedula, { jornada: j, nombreGrado: grado });
        onListo(`${docente.nombre} ahora dirige ${grado} (${NOMBRE_JORNADA[j].toLowerCase()}).`);
      } else {
        await docentesApi.intercambiar(docente.cedula, otro!.cedula);
        onListo(`Se intercambiaron ${docente.nombre} y ${otro!.nombre}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo hacer el cambio.');
      setEnviando(false);
    }
  }

  const nota = !jornada ? 'Primero elige la jornada'
    : !opciones.length ? 'No hay grados libres en esta jornada. Usa «Intercambiar con otro».' : '';

  return (
    <Dialogo titulo="Cambiar grado y jornada" ancho="max-w-[620px]" borde={false} onCerrar={onCerrar}
      avatar={avatarDialogo(docente.nombre)}
      subtitulo={<><b className="text-white">{docente.nombre}</b> · Ahora: {asignacionDe(docente)}</>}>
      <form onSubmit={enviar} noValidate>
        <div role="radiogroup" aria-label="Tipo de cambio" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-(--p-menta)">
          {MODOS.map(({ valor, texto, Icono }) => (
            <button key={valor} type="button" role="radio" aria-checked={modo === valor}
              onClick={() => { setModo(valor); setError(''); }}
              className={`h-11 px-2 inline-flex items-center justify-center gap-2 rounded-[10px] text-[13px] sm:text-[14px] transition-colors ${
                modo === valor ? 'bg-(--p-acento) text-[#160c28] font-bold' : 'font-medium hover:bg-(--p-sup)/60'
              }`}>
              <Icono tam={15} /><span className="truncate">{texto}</span>
            </button>
          ))}
        </div>

        {modo === 'mover' ? (
          <>
            <SelectorJornada valor={jornada} onCambio={setJornada} />
            <div className="mt-4">
              <label className="block">
                <span className={claseEtiqueta}>Grado a dirigir<span className="text-(--p-tinta)"> *</span></span>
                <span className="relative block">
                  <select value={grado} onChange={e => setGradoElegido(e.target.value)}
                    disabled={!jornada || !opciones.length} aria-describedby={nota ? idNota : undefined}
                    className={`${claseCampo} appearance-none pr-10 cursor-pointer disabled:cursor-not-allowed disabled:bg-(--p-menta) disabled:text-(--p-tenue)`}>
                    <option value="">Selecciona un grado libre</option>
                    {opciones.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-(--p-suave)">
                    {!jornada || !opciones.length ? <I.Candado tam={15} /> : <I.ChevronAbajo tam={16} />}
                  </span>
                </span>
              </label>
              {nota && <p id={idNota} className="mt-2 text-[12.5px] text-(--p-suave)">{nota}</p>}
            </div>
          </>
        ) : (
          <>
            <SelectorDocente opciones={otros} valor={con} onCambio={setCon} />
            {otro && (
              <ul className="mt-4 space-y-1.5 rounded-[14px] bg-(--p-menta) px-4 py-3 text-[13.5px]">
                <li><b>{docente.nombre}</b> pasa a <b>{asignacionDe(otro)}</b></li>
                <li><b>{otro.nombre}</b> pasa a <b>{asignacionDe(docente)}</b></li>
              </ul>
            )}
          </>
        )}

        <ErrorFormulario texto={error} />
        <BotonesFicha onCancelar={onCerrar} enviando={enviando} deshabilitado={!listo}
          {...(modo === 'mover'
            ? { texto: 'Mover', textoEnviando: 'Moviendo…', Icono: I.Mover }
            : { texto: 'Intercambiar', textoEnviando: 'Intercambiando…', Icono: I.Intercambiar })} />
      </form>
    </Dialogo>
  );
}

/** Lista desplegable de docentes con su avatar y su grado (el select nativo no muestra eso). */
function SelectorDocente({ opciones, valor, onCambio }: {
  opciones: DocenteListItem[]; valor: string; onCambio: (cedula: string) => void;
}) {
  const [abierto, setAbierto] = useState(!valor);
  const idEtiqueta = useId();
  const idLista = useId();
  const elegido = opciones.find(d => d.cedula === valor);
  return (
    <div className="mt-4">
      <span id={idEtiqueta} className={claseEtiqueta}>Intercambiar con<span className="text-(--p-tinta)"> *</span></span>
      <button type="button" onClick={() => setAbierto(a => !a)} disabled={!opciones.length}
        aria-expanded={abierto} aria-controls={idLista} aria-labelledby={idEtiqueta}
        className={`${claseCampo} flex items-center gap-3 text-left cursor-pointer disabled:cursor-not-allowed disabled:bg-(--p-menta)
                    ${abierto ? 'border-(--p-acento)! ring-3 ring-(--p-acento)/20' : ''}`}>
        {elegido ? (
          <>
            <Avatar nombre={elegido.nombre} tam="size-7" letra="text-[10.5px]" />
            <span className="flex-1 min-w-0 truncate">
              <span className="font-semibold">{elegido.nombre}</span>
              <span className="text-(--p-suave)"> · {asignacionDe(elegido)}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 min-w-0 truncate text-(--p-suave)">{opciones.length ? 'Selecciona un docente' : 'No hay otros docentes con grado'}</span>
        )}
        <span className={`shrink-0 text-(--p-suave) transition-transform ${abierto ? 'rotate-180' : ''}`}><I.ChevronAbajo tam={16} /></span>
      </button>
      {abierto && opciones.length > 0 && (
        <ul id={idLista} className="mt-2 max-h-[330px] overflow-y-auto rounded-xl border border-(--p-borde) divide-y divide-(--p-borde) bg-(--p-campo)">
          {opciones.map(d => (
            <li key={d.cedula}>
              <button type="button" aria-pressed={d.cedula === valor} onClick={() => { onCambio(d.cedula); setAbierto(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                  d.cedula === valor ? 'bg-(--p-menta)' : 'hover:bg-(--p-hover)'
                }`}>
                <Avatar nombre={d.nombre} />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold">{d.nombre}</span>
                  <span className="block truncate text-[12px] text-(--p-suave)">{asignacionDe(d)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DialogoRestablecer({ docente, onCerrar }: { docente: DocenteListItem; onCerrar: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState<Credenciales | null>(null);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setEnviando(true);
    setError('');
    try {
      setListo(await clavesApi.restablecer('docente', docente.cedula));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialogo titulo="Restablecer contraseña" onCerrar={onCerrar}>
      {listo ? (
        <>
          <p className="text-[14.5px]">Listo. La contraseña de <b>{docente.nombre}</b> volvió a ser su usuario:</p>
          <Credenciales c={listo} />
          <BotonListo onClick={onCerrar} />
        </>
      ) : (
        <form onSubmit={enviar}>
          <p className="text-[14.5px] leading-relaxed">
            ¿Restablecer la contraseña de <b>{docente.nombre}</b>?
          </p>
          <p className="mt-2 text-[13px] text-(--p-suave)">
            Su contraseña volverá a ser su cédula ({docente.cedula}) y tendrá que cambiarla al entrar. Úsalo si la olvidó.
          </p>
          <ErrorFormulario texto={error} />
          <BotonesDialogo onCancelar={onCerrar} texto="Restablecer" enviando={enviando} peligro />
        </form>
      )}
    </Dialogo>
  );
}
