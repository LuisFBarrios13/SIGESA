// src/layouts/AdminLayout.tsx — estructura del panel del administrador:
// barra lateral, barra superior (buscador, avisos, tema y usuario) y contenido.
import { useEffect, useRef, useState, type ComponentProps, type ComponentType, type ReactNode } from 'react';
import { useTema, type Tema } from '../hooks/useTema';
import { useDashboard } from '../hooks/useDashboard';
import { useClickFuera } from '../hooks/useClickFuera';
import { useScrollVisible } from '../hooks/useScrollVisible';
import { estudiantesApi } from '../services/api';
import type { AuthUser } from '../types/auth';
import type { EstudianteListItem } from '../types/estudiantes';
import type { DashboardData } from '../types/dashboard';
import { documento, iniciales, nombreGrado } from '../utils/formato';
import InicioPage from '../pages/admin/InicioPage';
import EstudiantesPage from '../pages/admin/EstudiantesPage';
import MatriculaPage from '../pages/admin/MatriculaPage';
import DocentesPage from '../pages/admin/DocentesPage';
import { ESCALA_CONTENIDO, ID_CAPA } from './escala';
import * as I from '../components/iconos';

export type Seccion =
  | 'inicio' | 'estudiantes' | 'matriculas' | 'notas'
  | 'docentes' | 'acudientes' | 'deudores' | 'pagos' | 'cuenta';

type IconoComp = ComponentType<{ tam?: number }>;

const MENU: { grupo: string; items: { id: Seccion; label: string; Icono: IconoComp }[] }[] = [
  {
    grupo: 'Menú',
    items: [
      { id: 'inicio', label: 'Inicio', Icono: I.Casa },
      { id: 'estudiantes', label: 'Estudiantes', Icono: I.Estudiantes },
      { id: 'matriculas', label: 'Matrículas', Icono: I.Documento },
      { id: 'notas', label: 'Notas y boletines', Icono: I.Barras },
      { id: 'docentes', label: 'Docentes', Icono: I.Persona },
      { id: 'acudientes', label: 'Acudientes', Icono: I.Familia },
      { id: 'deudores', label: 'Deudores', Icono: I.Alerta },
      { id: 'pagos', label: 'Pagos', Icono: I.Tarjeta },
    ],
  },
];

const TITULOS: Record<Seccion, string> = {
  inicio: 'Inicio', estudiantes: 'Estudiantes', matriculas: 'Matrículas',
  notas: 'Notas y boletines', docentes: 'Docentes', acudientes: 'Acudientes',
  deudores: 'Deudores', pagos: 'Pagos', cuenta: 'Cambiar contraseña',
};


interface Props {
  user: AuthUser;
  onLogout: () => void;
}

export default function AdminLayout({ user, onLogout }: Props) {
  const { tema, cambiarTema } = useTema();
  useScrollVisible();
  const [seccion, setSeccion] = useState<Seccion>('inicio');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const dashboard = useDashboard(year);
  /** Estudiante cuya ficha se abre al llegar a Estudiantes (desde el buscador). */
  const [estudianteAbierto, setEstudianteAbierto] = useState<string | null>(null);
  /** Menú lateral del celular y la tablet. */
  const [menuAbierto, setMenuAbierto] = useState(false);

  function verEstudiante(id: string) {
    setEstudianteAbierto(id);
    setSeccion('estudiantes');
  }

  function ir(s: Seccion) {
    setMenuAbierto(false);
    setSeccion(s);
    window.scrollTo({ top: 0 });
  }

  const propsMenu = {
    seccion,
    tema,
    onCambiarTema: cambiarTema,
    onLogout,
    year,
    periodo: dashboard.data?.academico.periodoActual ?? null,
  };

  return (
    <div
      data-tema={tema}
      className="panel min-h-dvh bg-(--p-fondo) text-(--p-tinta) p-3 min-[400px]:p-4 pb-[104px] min-[400px]:pb-[104px] sm:px-6 lg:px-8 lg:pb-4 transition-colors
                 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-5"
    >
      <BarraLateral {...propsMenu} onIr={ir} />

      <div
        className="min-w-0 flex flex-col gap-3 lg:gap-5"
        // El zoom también achica las unidades de pantalla, así que el alto mínimo se compensa.
        style={{ zoom: ESCALA_CONTENIDO, minHeight: `calc((100dvh - 2rem) / ${ESCALA_CONTENIDO})` }}
      >
        <BarraSuperior
          user={user}
          tema={tema}
          onCambiarTema={cambiarTema}
          onIr={ir}
          onLogout={onLogout}
          onVerEstudiante={verEstudiante}
          data={dashboard.data}
        />
        <BarraSuperiorMovil
          user={user}
          tema={tema}
          onCambiarTema={cambiarTema}
          onIr={ir}
          onLogout={onLogout}
          onVerEstudiante={verEstudiante}
          onAbrirMenu={() => setMenuAbierto(true)}
          data={dashboard.data}
          // Estudiantes tiene su propio buscador en la lista: ahí se omite esta fila.
          conBuscador={seccion !== 'estudiantes'}
        />

        {/* Contenedor grande con todo el contenido de la sección */}
        <div className="flex-1 flex flex-col rounded-[24px] lg:rounded-[28px] bg-(--p-contenedor) border border-(--p-borde) p-3 min-[400px]:p-3.5 sm:p-5 xl:p-7 transition-colors">
        {seccion === 'inicio' ? (
          <InicioPage
            user={user}
            year={year}
            onCambiarYear={setYear}
            onIr={setSeccion}
            {...dashboard}
          />
        ) : seccion === 'estudiantes' ? (
          <EstudiantesPage
            onIr={setSeccion}
            abrirId={estudianteAbierto}
            onAbierto={() => setEstudianteAbierto(null)}
          />
        ) : seccion === 'matriculas' ? (
          <MatriculaPage onIr={ir} onVerEstudiante={verEstudiante} />
        ) : seccion === 'docentes' ? (
          <DocentesPage onCambio={dashboard.recargar} />
        ) : (
          <EnConstruccion titulo={TITULOS[seccion]} onVolver={() => setSeccion('inicio')} />
        )}
        </div>
      </div>

      <NavegacionInferior seccion={seccion} onIr={ir} onMas={() => setMenuAbierto(true)} />
      {menuAbierto && <MenuMovil {...propsMenu} onIr={ir} onCerrar={() => setMenuAbierto(false)} />}

      {/* Ficha lateral y diálogos: fuera del zoom para poder cubrir toda la pantalla */}
      <div id={ID_CAPA} />
    </div>
  );
}

/* ── Celular y tablet: menú lateral y barra de abajo ───────────── */

function MenuMovil({ onCerrar, ...props }: ComponentProps<typeof BarraLateral> & { onCerrar: () => void }) {
  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alTecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTecla);
      document.body.style.overflow = antes;
    };
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
      <div className="velo absolute inset-0 bg-black/45" onClick={onCerrar} />
      <div className="cajon-izq absolute inset-y-3 left-3 w-[min(300px,calc(100vw-56px))]">
        <BarraLateral {...props} enCajon onCerrar={onCerrar} />
      </div>
    </div>
  );
}

const NAV_INFERIOR: { id: Seccion; label: string; Icono: IconoComp }[] = [
  { id: 'inicio', label: 'Inicio', Icono: I.Casa },
  { id: 'estudiantes', label: 'Estudiantes', Icono: I.Estudiantes },
  { id: 'pagos', label: 'Pagos', Icono: I.Tarjeta },
];

function NavegacionInferior({ seccion, onIr, onMas }: { seccion: Seccion; onIr: (s: Seccion) => void; onMas: () => void }) {
  const enMas = !NAV_INFERIOR.some(n => n.id === seccion);
  const clase = (activo: boolean) =>
    `flex flex-col items-center justify-center gap-1 rounded-2xl text-[11px] transition-colors ${
      activo ? 'bg-(--p-acento) text-[#170f27] font-bold' : 'text-(--p-suave) font-medium hover:text-(--p-tinta)'
    }`;
  return (
    <nav
      aria-label="Secciones"
      className="lg:hidden fixed z-30 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] min-[400px]:w-[calc(100%-32px)] max-w-[560px] bottom-[max(16px,env(safe-area-inset-bottom))] grid grid-cols-4 gap-1 h-[68px] p-1.5
                 rounded-[22px] bg-(--p-sup) border border-(--p-borde) shadow-lg shadow-black/5 transition-colors"
    >
      {NAV_INFERIOR.map(({ id, label, Icono }) => (
        <button
          key={id}
          type="button"
          onClick={() => onIr(id)}
          aria-current={seccion === id ? 'page' : undefined}
          className={clase(seccion === id)}
        >
          <Icono tam={18} />
          {label}
        </button>
      ))}
      <button type="button" onClick={onMas} className={clase(enMas)}>
        <I.Grilla tam={18} />
        Más
      </button>
    </nav>
  );
}

/* ── Barra lateral ─────────────────────────────────────────────── */

function BarraLateral({
  seccion, onIr, tema, onCambiarTema, onLogout, year, periodo, enCajon = false, onCerrar,
}: {
  seccion: Seccion;
  onIr: (s: Seccion) => void;
  tema: Tema;
  onCambiarTema: (t: Tema) => void;
  onLogout: () => void;
  year: number;
  periodo: number | null;
  /** Dibujada dentro del menú deslizable del celular. */
  enCajon?: boolean;
  onCerrar?: () => void;
}) {
  return (
    <aside
      // En computador: fija al hacer scroll y del alto de la pantalla.
      className={`flex-col overflow-hidden rounded-[22px] bg-(--p-sup) border border-(--p-borde) transition-colors ${
        enCajon ? 'flex h-full' : 'hidden lg:flex sticky top-4 h-[calc(100dvh-2rem)]'
      }`}
    >
      {/* Marca */}
      <div className="shrink-0 flex items-center gap-2.5 h-[clamp(56px,7.5dvh,72px)] px-3.5 bg-(--p-banda) text-white">
        <span className="grid place-items-center shrink-0 size-9 rounded-xl bg-(--p-acento) text-[#170f27]">
          <I.Libro tam={18.32} />
        </span>
        <div className="flex-1 leading-tight min-w-0">
          <p className="text-[14.15px] font-extrabold tracking-[0.08em]">SIGESA</p>
          <p className="text-[8.74px] tracking-[-0.01em] text-white/80 whitespace-nowrap">Colegio Pedagógico San Agustín</p>
        </div>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="grid place-items-center shrink-0 size-9 rounded-xl text-white/80 hover:bg-white/10"
          >
            <I.Cerrar tam={18} />
          </button>
        )}
      </div>

      {/* Menú */}
      {/* Los altos se ajustan a la pantalla (dvh) para que todo quepa sin scroll */}
      <nav className="flex-1 min-h-0 flex flex-col overflow-y-auto px-2 pt-[clamp(8px,2dvh,20px)] pb-[clamp(8px,2dvh,20px)]">
        {MENU.map(({ grupo, items }) => (
          <div key={grupo}>
            <p className="px-2 mb-1 text-[9.16px] leading-4 font-bold tracking-[0.16em] uppercase text-(--p-suave)">{grupo}</p>
            <ul className="flex flex-col gap-[clamp(2px,1.6dvh,15px)]">
              {items.map(({ id, label, Icono }) => {
                const activo = seccion === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => onIr(id)}
                      aria-current={activo ? 'page' : undefined}
                      className={`w-full flex items-stretch h-[clamp(28px,4.7dvh,44px)] rounded-[9px] overflow-hidden text-left text-[12.49px] transition-colors ${
                        activo
                          ? 'bg-(--p-acento) text-[#170f27] font-semibold'
                          : 'font-medium hover:bg-(--p-hover)'
                      }`}
                    >
                      <span className="flex-1 flex items-center justify-between pl-5 pr-4">
                        {label}
                        <span className={activo ? '' : 'text-(--p-suave)'}><Icono tam={14.99} /></span>
                      </span>
                      {activo && (
                        <span className="grid place-items-center w-10 bg-(--p-acento-2)">
                          <I.ChevronDerecha tam={13.33} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Año escolar y acciones */}
      <div className="shrink-0 px-4 py-[clamp(10px,1.7dvh,16px)] space-y-[clamp(8px,1.2dvh,12px)] border-t border-(--p-borde)">
        <div className="flex items-center gap-3 rounded-[14px] bg-(--p-menta) px-3.5 py-[clamp(6px,1dvh,10px)]">
          <span className="text-(--p-suave)"><I.Calendario tam={14.99} /></span>
          <div className="leading-tight">
            <p className="text-[9.16px] font-bold tracking-[0.14em] text-(--p-suave)">AÑO ESCOLAR {year}</p>
            <p className="text-[10.83px] font-semibold">{periodo ? `Periodo ${periodo}` : 'Sin notas registradas'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 h-[clamp(36px,4.7dvh,44px)] rounded-xl overflow-hidden">
          <BotonBarra
            etiqueta={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            onClick={() => onCambiarTema(tema === 'oscuro' ? 'claro' : 'oscuro')}
          >
            {tema === 'oscuro' ? <I.SolRayos tam={14.99} /> : <I.Luna tam={14.99} />}
          </BotonBarra>
          <BotonBarra etiqueta="Cambiar contraseña" onClick={() => onIr('cuenta')} conBorde>
            <I.Llave tam={14.99} />
          </BotonBarra>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid place-items-center bg-(--p-acento) text-[#170f27] hover:brightness-105 transition"
          >
            <I.Salir tam={14.99} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function BotonBarra({
  etiqueta, onClick, conBorde = false, children,
}: { etiqueta: string; onClick: () => void; conBorde?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className={`grid place-items-center bg-(--p-icono) text-white hover:brightness-125 transition ${
        conBorde ? 'border-l border-white/15' : ''
      }`}
    >
      {children}
    </button>
  );
}

/* ── Barra superior ────────────────────────────────────────────── */

function BarraSuperior({
  user, tema, onCambiarTema, onIr, onLogout, onVerEstudiante, data,
}: {
  user: AuthUser;
  tema: Tema;
  onCambiarTema: (t: Tema) => void;
  onIr: (s: Seccion) => void;
  onLogout: () => void;
  onVerEstudiante: (id: string) => void;
  data: DashboardData | null;
}) {
  return (
    <header className="hidden lg:flex relative z-20 items-stretch gap-4 h-[64px]">
      <div className="flex-1 min-w-0 flex items-center px-3 rounded-[22px] bg-(--p-sup) border border-(--p-borde) transition-colors">
        <Buscador onIr={onIr} onVerEstudiante={onVerEstudiante} />
      </div>
      <div className="shrink-0 flex items-center gap-2.5 px-3 rounded-[22px] bg-(--p-sup) border border-(--p-borde) transition-colors">
        <Campanita data={data} onIr={onIr} />
        <SelectorTema tema={tema} onCambiar={onCambiarTema} />
        <MenuUsuario user={user} onIr={onIr} onLogout={onLogout} />
      </div>
    </header>
  );
}

/** Celular y tablet: marca con menú, tema y usuario; debajo (si aplica), buscador y avisos. */
function BarraSuperiorMovil({
  user, tema, onCambiarTema, onIr, onLogout, onVerEstudiante, onAbrirMenu, data, conBuscador = true,
}: ComponentProps<typeof BarraSuperior> & { onAbrirMenu: () => void; conBuscador?: boolean }) {
  return (
    <header className="lg:hidden relative z-20 flex flex-col gap-3">
      <div className="flex items-center gap-2.5 h-[58px] px-2 rounded-[20px] bg-(--p-sup) border border-(--p-borde) transition-colors">
        <button
          type="button"
          onClick={onAbrirMenu}
          aria-label="Abrir menú"
          className="grid place-items-center shrink-0 size-10 rounded-xl bg-(--p-icono) text-(--p-acento) hover:brightness-125"
        >
          <I.Lista tam={19} />
        </button>
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-[14px] font-extrabold tracking-[0.08em]">SIGESA</p>
          <p className="text-[9.5px] text-(--p-suave) truncate">Colegio Pedagógico San Agustín</p>
        </div>
        <SelectorTema tema={tema} onCambiar={onCambiarTema} />
        <MenuUsuario user={user} onIr={onIr} onLogout={onLogout} compacto />
      </div>

      {conBuscador && (
        <div className="flex items-stretch gap-2.5 h-[50px]">
          <div className="flex-1 min-w-0 flex items-center rounded-2xl bg-(--p-sup) border border-(--p-borde) transition-colors">
            <Buscador onIr={onIr} onVerEstudiante={onVerEstudiante} movil />
          </div>
          <Campanita data={data} onIr={onIr} movil />
        </div>
      )}
    </header>
  );
}

function Buscador({
  onIr, onVerEstudiante, movil = false,
}: { onIr: (s: Seccion) => void; onVerEstudiante: (id: string) => void; movil?: boolean }) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [resultados, setResultados] = useState<EstudianteListItem[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const caja = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useClickFuera(caja, abierto, () => setAbierto(false));

  // Ctrl + K (o ⌘ + K) lleva al buscador desde cualquier parte
  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', alTecla);
    return () => document.removeEventListener('keydown', alTecla);
  }, []);

  // Busca 300 ms después de la última tecla
  const q = texto.trim();
  useEffect(() => {
    if (q.length < 2) {
      setResultados([]);
      setError('');
      return;
    }
    let vigente = true;
    setBuscando(true);
    const t = setTimeout(() => {
      estudiantesApi
        .buscar(q)
        .then(r => { if (vigente) { setResultados(r.slice(0, 8)); setError(''); } })
        .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo buscar.'); })
        .finally(() => { if (vigente) setBuscando(false); });
    }, 300);
    return () => { vigente = false; clearTimeout(t); };
  }, [q]);

  function ir(s: Seccion) {
    setAbierto(false);
    setTexto('');
    onIr(s);
  }

  return (
    <div ref={caja} className="relative w-full">
      <label
        className={`flex items-center gap-3 px-3.5 rounded-xl transition-colors ${
          movil ? 'h-[48px] px-4' : 'h-10 border border-(--p-borde) focus-within:border-(--p-acento)'
        }`}
      >
        <span className="text-(--p-suave)"><I.Buscar tam={17.85} /></span>
        <input
          ref={input}
          type="search"
          value={texto}
          onChange={e => { setTexto(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          placeholder="Buscar estudiante…"
          aria-label="Buscar estudiante"
          className="flex-1 min-w-0 bg-transparent text-[14.7px] outline-none placeholder:text-(--p-suave)"
        />
      </label>

      {abierto && q.length >= 2 && (
        <div
          className="emergente-suave absolute left-0 right-0 top-[calc(100%+8px)] max-h-[420px] overflow-y-auto rounded-2xl
                     bg-(--p-sup) border border-(--p-borde) shadow-xl shadow-black/10 p-1.5"
        >
          {buscando && !resultados.length ? (
            <p className="px-3 py-3 text-[13.65px] text-(--p-suave)">Buscando…</p>
          ) : error ? (
            <p className="px-3 py-3 text-[13.65px] text-red-600">{error}</p>
          ) : !resultados.length ? (
            <p className="px-3 py-3 text-[13.65px] text-(--p-suave)">No hay estudiantes que coincidan con “{q}”.</p>
          ) : (
            <ul>
              {resultados.map(e => {
                const ultima = [...e.matriculas].sort((a, b) => b.year - a.year)[0];
                return (
                  <li key={e.numero_identidad} className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-(--p-hover)">
                    <span className="grid place-items-center shrink-0 size-9 rounded-full bg-(--p-menta) text-[12.6px] font-bold">
                      {iniciales(e.nombre)}
                    </span>
                    <div className="flex-1 min-w-0 leading-tight">
                      <p className="text-[14.7px] font-semibold truncate">{e.nombre}</p>
                      <p className="text-[12.6px] text-(--p-suave) truncate">
                        Doc. {documento(e.numero_identidad)}
                        {ultima?.grado && ` · ${nombreGrado(ultima.grado.nombre, ultima.grado.jornada)} ${ultima.year}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAbierto(false); setTexto(''); onVerEstudiante(e.numero_identidad); }}
                      className="h-8 px-3 rounded-lg border border-(--p-borde) text-[12.6px] font-semibold hover:bg-(--p-sup)"
                    >
                      Ver ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => ir('pagos')}
                      className="h-8 px-3 rounded-lg bg-(--p-acento) text-[#170f27] text-[12.6px] font-bold hover:brightness-105"
                    >
                      Pagar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface Aviso {
  texto: string;
  detalle: string;
  ir: Seccion;
}

/** Avisos que salen de los datos y desaparecen solos cuando se resuelven. */
function calcularAvisos(d: DashboardData | null): Aviso[] {
  if (!d) return [];
  const avisos: Aviso[] = [];
  if (d.totalDeudores > 0) {
    avisos.push({
      texto: `${d.totalDeudores} ${d.totalDeudores === 1 ? 'estudiante' : 'estudiantes'} con pagos vencidos`,
      detalle: 'Revisa la cartera y contacta a los acudientes.',
      ir: 'deudores',
    });
  }
  if (d.gradosSinDocente > 0) {
    avisos.push({
      texto: `${d.gradosSinDocente} ${d.gradosSinDocente === 1 ? 'grado' : 'grados'} sin director de grupo`,
      detalle: 'Asígnales un docente desde Docentes.',
      ir: 'docentes',
    });
  }
  const { estudiantesConMateriasPerdidas: perdiendo, periodoActual } = d.academico;
  if (perdiendo > 0) {
    avisos.push({
      texto: `${perdiendo} ${perdiendo === 1 ? 'estudiante pierde' : 'estudiantes pierden'} materias en el periodo ${periodoActual}`,
      detalle: `Tienen al menos una nota por debajo de ${d.academico.notaAprobatoria.toLocaleString('es-CO', { minimumFractionDigits: 1 })}.`,
      ir: 'notas',
    });
  }
  return avisos;
}

function Campanita({
  data, onIr, movil = false,
}: { data: DashboardData | null; onIr: (s: Seccion) => void; movil?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  useClickFuera(caja, abierto, () => setAbierto(false));
  const avisos = calcularAvisos(data);

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-label={avisos.length ? `Pendientes: ${avisos.length}` : 'Pendientes'}
        aria-expanded={abierto}
        className={`relative grid place-items-center border border-(--p-borde) hover:bg-(--p-hover) transition-colors ${
          movil ? 'size-[50px] rounded-2xl bg-(--p-sup)' : 'size-10 rounded-xl'
        }`}
      >
        <I.Campana tam={18.9} />
        {avisos.length > 0 && (
          <span
            className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full
                       bg-(--p-acento) text-[#170f27] text-[11.03px] font-bold ring-2 ring-(--p-sup)"
          >
            {avisos.length}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className="emergente absolute right-0 top-[calc(100%+8px)] w-[min(340px,calc(100vw-32px))] rounded-2xl bg-(--p-sup) border border-(--p-borde)
                     shadow-xl shadow-black/10 overflow-hidden"
        >
          <p className="px-4 h-11 flex items-center bg-(--p-banda) text-white text-[12.6px] font-bold tracking-[0.14em]">
            PENDIENTES
          </p>
          {avisos.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-4 text-[14.7px] font-medium">
              <span className="text-(--p-acento)"><I.Check tam={18.9} /></span> Todo al día
            </p>
          ) : (
            <ul className="p-1.5">
              {avisos.map(a => (
                <li key={a.texto}>
                  <button
                    type="button"
                    onClick={() => { setAbierto(false); onIr(a.ir); }}
                    className="w-full flex items-start gap-3 text-left rounded-xl px-2.5 py-2.5 hover:bg-(--p-hover)"
                  >
                    <span className="grid place-items-center shrink-0 size-8 rounded-lg bg-(--p-acento) text-[#170f27]">
                      <I.Alerta tam={16.8} />
                    </span>
                    <span className="flex-1 leading-snug">
                      <span className="block text-[14.18px] font-semibold">{a.texto}</span>
                      <span className="block text-[12.6px] text-(--p-suave)">{a.detalle}</span>
                    </span>
                    <span className="mt-1.5 text-(--p-suave)"><I.ChevronDerecha tam={15.75} /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SelectorTema({ tema, onCambiar }: { tema: Tema; onCambiar: (t: Tema) => void }) {
  const boton = (t: Tema, etiqueta: string, icono: ReactNode) => (
    <button
      type="button"
      onClick={() => onCambiar(t)}
      aria-label={etiqueta}
      aria-pressed={tema === t}
      className={`grid place-items-center h-8 w-10 rounded-[9px] transition-colors ${
        tema === t ? 'bg-(--p-acento) text-[#170f27]' : 'text-(--p-suave) hover:text-(--p-tinta)'
      }`}
    >
      {icono}
    </button>
  );
  return (
    <div className="flex gap-1 h-10 p-1 rounded-xl bg-(--p-menta) transition-colors">
      {boton('claro', 'Modo claro', <I.Sol tam={17.85} />)}
      {boton('oscuro', 'Modo oscuro', <I.Luna tam={17.85} />)}
    </div>
  );
}

function MenuUsuario({
  user, onIr, onLogout, compacto = false,
}: { user: AuthUser; onIr: (s: Seccion) => void; onLogout: () => void; compacto?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  useClickFuera(caja, abierto, () => setAbierto(false));

  return (
    <div ref={caja} className="relative shrink-0">
      {compacto ? (
        <button
          type="button"
          onClick={() => setAbierto(a => !a)}
          aria-expanded={abierto}
          aria-haspopup="menu"
          aria-label="Menú de usuario"
          className="grid place-items-center size-10 rounded-full bg-(--p-acento) text-[#170f27] text-[13px] font-bold hover:brightness-105"
        >
          {iniciales(user.nombre || user.username)}
        </button>
      ) : (
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 h-10 pl-1.5 pr-3 rounded-xl border border-(--p-borde) hover:bg-(--p-hover) transition-colors"
      >
        <span className="grid place-items-center size-8 rounded-full bg-(--p-acento) text-[#170f27] text-[12.6px] font-bold">
          {iniciales(user.nombre || user.username)}
        </span>
        <span className="hidden md:block text-left leading-tight">
          <span className="block text-[13.65px] font-semibold max-w-[160px] truncate">{user.nombre || user.username}</span>
          <span className="block text-[11.55px] text-(--p-suave)">Administrador · {user.username}</span>
        </span>
        <span className="text-(--p-suave)"><I.ChevronAbajo tam={16.8} /></span>
      </button>
      )}

      {abierto && (
        <div
          role="menu"
          className="emergente absolute right-0 top-[calc(100%+8px)] w-[230px] rounded-2xl bg-(--p-sup) border border-(--p-borde)
                     shadow-xl shadow-black/10 p-1.5"
        >
          <div className="px-3 py-2.5 border-b border-(--p-borde) mb-1">
            <p className="text-[14.7px] font-semibold truncate">{user.nombre || user.username}</p>
            <p className="text-[12.6px] text-(--p-suave)">Administrador</p>
          </div>
          <OpcionMenu onClick={() => { setAbierto(false); onIr('cuenta'); }} icono={<I.Llave tam={17.85} />}>
            Cambiar contraseña
          </OpcionMenu>
          <OpcionMenu onClick={onLogout} icono={<I.Salir tam={17.85} />}>
            Cerrar sesión
          </OpcionMenu>
        </div>
      )}
    </div>
  );
}

function OpcionMenu({ onClick, icono, children }: { onClick: () => void; icono: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-3 h-10 px-3 rounded-xl text-[14.7px] font-medium hover:bg-(--p-hover)"
    >
      <span className="text-(--p-suave)">{icono}</span>
      {children}
    </button>
  );
}

/* ── Secciones pendientes ──────────────────────────────────────── */

function EnConstruccion({ titulo, onVolver }: { titulo: string; onVolver: () => void }) {
  return (
    <main className="aparecer">
      <h1 className="text-[30px] font-extrabold tracking-tight">{titulo}</h1>
      <div className="mt-5 rounded-[22px] bg-(--p-sup) border border-(--p-borde) p-8">
        <p className="text-[15px] text-(--p-suave)">Esta sección todavía está en construcción.</p>
        <button
          type="button"
          onClick={onVolver}
          className="mt-5 h-10 px-4 rounded-xl bg-(--p-banda) text-white text-[12.5px] font-bold tracking-[0.12em]"
        >
          VOLVER AL INICIO
        </button>
      </div>
    </main>
  );
}
