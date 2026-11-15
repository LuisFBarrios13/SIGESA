import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent, type ReactNode } from 'react'
import { authApi, saveToken } from '../services/api'
import type { AuthUser } from '../types/auth'

interface Props {
  onLogin: (user: AuthUser) => void
}

type Tema = 'claro' | 'oscuro'
const TEMA_KEY = 'sigesa_tema'

function temaGuardado(): Tema {
  try {
    return localStorage.getItem(TEMA_KEY) === 'oscuro' ? 'oscuro' : 'claro'
  } catch {
    return 'claro'
  }
}

/**
 * La caja del login se diseñó sobre una pantalla de 1920×1080 (docs/login-example.png):
 * mide 1380×920 px y ocupa el 72 % del ancho y el 85 % del alto.
 * En computador se escala completa para conservar esas proporciones en cualquier pantalla.
 */
const DISENO = { ancho: 1920, alto: 1080 }
const ESCALA_MIN = 0.6
// La caja se ve un 10 % más grande que en el diseño original
const AUMENTO = 1.1

// Densidad de píxeles al cargar la página. Si después cambia es porque el usuario usó
// el zoom del navegador (Ctrl + / Ctrl −), y ese zoom se debe respetar.
const DPR_INICIAL = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1

function calcularEscala(): number {
  if (typeof window === 'undefined' || window.innerWidth < 1024) return 1
  // Medimos la ventana sin el zoom del navegador: así el escalado solo sigue al
  // tamaño real de la pantalla y no anula el zoom que elija el usuario.
  const zoom = (window.devicePixelRatio || 1) / DPR_INICIAL
  const ancho = window.innerWidth * zoom
  const alto = window.innerHeight * zoom
  const e = Math.min(ancho / DISENO.ancho, alto / DISENO.alto) * AUMENTO
  return Math.max(ESCALA_MIN, e)
}

function useEscala(): number {
  const [escala, setEscala] = useState(calcularEscala)
  useEffect(() => {
    const alCambiar = () => setEscala(calcularEscala())
    window.addEventListener('resize', alCambiar)
    return () => window.removeEventListener('resize', alCambiar)
  }, [])
  return escala
}

/* ── Hoja del formulario movible (celular y tablet) ──────────────── */

/** Alto mínimo del dibujo al subir la hoja: siempre se ven el logo y el selector. */
const DIBUJO_MIN = 110
/** Parte de la hoja que siempre se ve al bajarla (px). */
const HOJA_MIN = 120
/** Cuánto baja la hoja con un toque: lo justo para ver el edificio entero con su suelo. */
const BAJADA_TOQUE = 90
/**
 * En la posición normal la hoja tapa la base del edificio (como en el diseño).
 * Al bajarla, el edificio sube hasta esta cantidad para verse entero.
 */
const REVELAR_MAX = 44

/** Alto del dibujo en la posición normal: el mismo que dan las clases de HeroMovil. */
function altoNormal(): number {
  const h = window.innerHeight
  return window.innerWidth >= 640
    ? Math.min(520, Math.max(320, h * 0.42))
    : Math.min(360, Math.max(220, h - 516))
}

/**
 * La hoja del formulario se arrastra desde su barrita: se sube o se baja a gusto
 * y se queda donde el usuario la suelta. Un toque la baja para ver el edificio
 * completo y otro la devuelve a su lugar.
 */
function useHojaMovible() {
  /** Alto del dibujo elegido por el usuario; null = posición normal. */
  const [alto, setAlto] = useState<number | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [animando, setAnimando] = useState(false)
  const inicio = useRef<{ y: number; alto: number; movido: boolean } | null>(null)

  // La animación dura 300 ms
  useEffect(() => {
    if (!animando) return
    const t = setTimeout(() => setAnimando(false), 350)
    return () => clearTimeout(t)
  }, [animando])

  const ajustar = (v: number) => Math.min(window.innerHeight - HOJA_MIN, Math.max(DIBUJO_MIN, v))
  const bajada = alto !== null && alto > altoNormal() + 4

  function moverA(v: number | null) {
    setAnimando(true)
    setAlto(v)
  }

  function alternar() {
    moverA(bajada ? null : ajustar(altoNormal() + BAJADA_TOQUE))
  }

  const manejadores = {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      inicio.current = { y: e.clientY, alto: alto ?? altoNormal(), movido: false }
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* algunos navegadores no permiten capturar este puntero: el arrastre sigue funcionando */
      }
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const i = inicio.current
      if (!i) return
      const dy = e.clientY - i.y
      if (!i.movido && Math.abs(dy) < 6) return
      i.movido = true
      setArrastrando(true)
      setAlto(ajustar(i.alto + dy))
    },
    onPointerUp() {
      const i = inicio.current
      inicio.current = null
      if (!i) return
      // Un toque sin arrastrar baja o sube la hoja; si se arrastró, se queda donde se soltó
      if (!i.movido) alternar()
      setArrastrando(false)
    },
    onPointerCancel() {
      inicio.current = null
      setArrastrando(false)
    },
  }

  return {
    alto,
    arrastrando,
    bajada,
    /** true cuando el usuario movió la hoja (o se está animando): la página mide justo la pantalla */
    movida: alto !== null || animando,
    /** Cuánto sube el edificio para que la hoja no tape su base (px) */
    revelar: alto === null ? 0 : Math.min(REVELAR_MAX, Math.max(0, alto - altoNormal())),
    alternar,
    manejadores,
  }
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [ayudaClave, setAyudaClave] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [tema, setTema] = useState<Tema>(temaGuardado)
  const escala = useEscala()
  const hoja = useHojaMovible()

  function cambiarTema(t: Tema) {
    setTema(t)
    try {
      localStorage.setItem(TEMA_KEY, t)
    } catch {
      /* sin almacenamiento: el tema solo dura esta visita */
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Escribe tu usuario y tu contraseña.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      const { token, user } = await authApi.login(username.trim(), password)
      saveToken(token)
      onLogin(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
      setEnviando(false)
    }
  }

  return (
    <div
      data-tema={tema}
      className={`login relative min-h-dvh overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-center
                 bg-(--l-panel) lg:bg-(--l-fondo) text-(--l-tinta) transition-colors ${hoja.movida ? 'max-lg:h-dvh' : ''}`}
    >
      {/* Círculos decorativos de la página (computador) */}
      <div aria-hidden className="hidden lg:block pointer-events-none">
        <div
          className="absolute rounded-full bg-(--l-circulo-1) transition-colors"
          style={{ top: -90 * escala, right: -110 * escala, width: 440 * escala, height: 440 * escala }}
        />
        <div
          className="absolute rounded-full bg-(--l-circulo-2) transition-colors"
          style={{ bottom: -120 * escala, left: -80 * escala, width: 400 * escala, height: 400 * escala }}
        />
      </div>

      {/* Celular y tablet: el colegio arriba, a todo el ancho */}
      <HeroMovil
        tema={tema}
        onCambiarTema={cambiarTema}
        alto={hoja.alto}
        revelar={hoja.revelar}
        arrastrando={hoja.arrastrando}
      />

      {/* Celular y tablet: hoja con el formulario que sube sobre el dibujo.
          Computador: caja de 1380×920 como en el diseño, escalada con la pantalla */}
      <div
        style={escala !== 1 ? { zoom: escala } : undefined}
        className={`relative flex-1 flex -mt-8 rounded-t-[32px] px-[22px] pt-8 pb-7 sm:px-10 bg-(--l-caja)
                   lg:flex-none lg:mt-0 lg:w-[1380px] lg:h-[920px] lg:shrink-0 lg:gap-6 lg:p-6
                   lg:rounded-[40px] lg:border lg:border-(--l-borde) lg:shadow-2xl lg:shadow-black/10 transition-colors
                   ${hoja.movida ? 'max-lg:min-h-0 max-lg:overflow-hidden' : ''}`}
      >
      {/* Barrita para mover la hoja: arrastrar la sube o la baja; un toque la baja para ver el dibujo */}
      <button
        type="button"
        {...hoja.manejadores}
        onClick={e => {
          // Con teclado (Enter o espacio) no hay arrastre: solo alterna
          if (e.detail === 0) hoja.alternar()
        }}
        aria-expanded={!hoja.bajada}
        aria-label={hoja.bajada ? 'Subir el formulario' : 'Bajar el formulario para ver el dibujo'}
        title="Arrastra para subir o bajar el formulario"
        className="lg:hidden absolute inset-x-0 top-0 z-10 h-8 flex justify-center pt-3 touch-none cursor-grab active:cursor-grabbing"
      >
        <span className="h-1.5 w-11 rounded-full bg-(--l-suave)/35" />
      </button>

      {/* Mitad izquierda: ilustración del colegio (solo en computador) */}
      <PanelColegio tema={tema} />

      {/* Mitad derecha: formulario */}
      <main className="relative flex-1 flex flex-col lg:px-4">
        <div className="hidden lg:flex justify-end">
          <SelectorTema tema={tema} onCambiar={cambiarTema} />
        </div>

        <div className="flex-1 flex justify-center lg:items-center lg:py-8">
          <div className="w-full max-w-[460px] flex flex-col sm:justify-center lg:block">
            <p className="hidden lg:block text-[13px] font-semibold tracking-[0.2em] text-(--l-suave)">
              SIGESA · PORTAL ESCOLAR
            </p>
            <h1 className="lg:mt-3 text-[1.9rem] sm:text-[2.2rem] lg:text-[2.75rem] leading-tight font-extrabold tracking-tight">
              ¡Hola de nuevo!
            </h1>
            <p className="mt-1 lg:mt-2 text-sm sm:text-[15px] lg:text-[17px] text-(--l-suave)">
              <span className="lg:hidden">
                <LibroLinea /> SIGESA ·{' '}
              </span>
              Ingresa a tu cuenta para continuar.
            </p>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex-1 sm:flex-none flex flex-col lg:block mt-6 lg:mt-11 space-y-6 lg:space-y-7"
            >
              <div>
                <label htmlFor="usuario" className="block mb-1.5 lg:mb-3 text-sm lg:text-[15px] font-bold">
                  Usuario
                </label>
                <Caja icono={<UsuarioIcono />}>
                  <input
                    id="usuario"
                    type="text"
                    autoComplete="username"
                    placeholder="Tu usuario"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-base lg:text-[17px] outline-none placeholder:text-(--l-suave)/60"
                  />
                </Caja>
              </div>

              <div>
                <label htmlFor="clave" className="block mb-1.5 lg:mb-3 text-sm lg:text-[15px] font-bold">
                  Contraseña
                </label>
                <Caja icono={<CandadoIcono />}>
                  <input
                    id="clave"
                    type={verClave ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-base lg:text-[17px] outline-none placeholder:text-(--l-suave)/60"
                  />
                  <button
                    type="button"
                    onClick={() => setVerClave(v => !v)}
                    aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="p-1 text-(--l-suave) hover:text-(--l-tinta)"
                  >
                    <OjoIcono tachado={verClave} />
                  </button>
                </Caja>

                <div className="mt-3 lg:mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAyudaClave(v => !v)}
                    aria-expanded={ayudaClave}
                    className="text-sm lg:text-[15px] font-bold border-b-2 border-(--l-acento) hover:opacity-75"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                {ayudaClave && (
                  <p className="mt-3 rounded-xl bg-(--l-campo) px-4 lg:px-5 py-3 lg:py-3.5 text-[13px] lg:text-[15px] text-(--l-suave)">
                    Pídele al administrador del colegio que te asigne una contraseña nueva.
                  </p>
                )}
              </div>

              {error && (
                <p role="alert" className="text-base font-medium text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="mt-auto w-full h-[56px] lg:h-[66px] rounded-2xl bg-(--l-acento) text-[#170f27] text-[17px] lg:text-lg font-bold
                           flex items-center justify-center gap-2.5
                           hover:brightness-105 active:scale-[0.99] transition
                           disabled:opacity-70 disabled:cursor-wait"
              >
                {enviando ? 'Ingresando…' : <>Ingresar <FlechaIcono /></>}
              </button>
            </form>

            <p className="mt-4 sm:mt-6 lg:mt-11 text-center text-[13px] lg:text-[15px] text-(--l-suave)">
              ¿No tienes acceso?{' '}
              <span className="font-bold text-(--l-tinta) border-b-2 border-(--l-acento)">
                Comunícate con el administrador
              </span>
            </p>
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}

/* ── Panel izquierdo ─────────────────────────────────────────── */

function PanelColegio({ tema }: { tema: Tema }) {
  return (
    <aside className="relative hidden lg:flex lg:basis-[60%] shrink-0 flex-col overflow-hidden rounded-[28px] bg-(--l-panel) transition-colors">
      {/* Sol de día, luna de noche */}
      {tema === 'claro' ? (
        <div aria-hidden className="absolute right-[12.5%] top-[13.5%] size-[142px] rounded-full bg-(--l-acento)" />
      ) : (
        <svg aria-hidden viewBox="0 0 100 100" className="absolute right-[12.5%] top-[13.5%] size-[126px]">
          <path d="M62 4 A46 46 0 1 0 98 74 A40 40 0 1 1 62 4 Z" fill="#efcb68" />
        </svg>
      )}

      <div className="relative shrink-0 px-7 pt-8">
        <Marca />
      </div>

      <div className="relative shrink-0 px-10 mt-12">
        <p className="text-[2.45rem] leading-[1.15] font-extrabold tracking-tight">
          Estudiamos con amor
          <br />
          para un futuro mejor.
        </p>
      </div>

      <div className="relative flex-1 min-h-0">
        <EscenaColegio tema={tema} />
      </div>

      {/* Lo que se puede consultar en SIGESA */}
      <dl className="relative shrink-0 grid grid-cols-3 gap-6 bg-(--l-banda) px-10 py-7 text-white transition-colors">
        <Dato titulo="Notas" detalle="Por periodo" />
        <Dato titulo="Boletines" detalle="Por estudiante" />
        <Dato titulo="Pagos" detalle="Estado de cuenta" />
      </dl>
    </aside>
  )
}

function Dato({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dd className="mt-1 text-sm text-white/80">{detalle}</dd>
      <dt className="text-[1.55rem] font-extrabold text-(--l-acento)">{titulo}</dt>
    </div>
  )
}

/** Parte de arriba en celular y tablet (docs/Teléfono · Modo claro@1x.png). */
function HeroMovil({
  tema,
  onCambiarTema,
  alto,
  revelar,
  arrastrando,
}: {
  tema: Tema
  onCambiarTema: (t: Tema) => void
  /** Alto elegido al mover la hoja (px); null = posición normal */
  alto: number | null
  /** Cuánto sube el edificio para que la hoja no tape su base (px) */
  revelar: number
  arrastrando: boolean
}) {
  const oscuro = tema === 'oscuro'
  return (
    <header
      style={alto !== null ? { height: alto } : undefined}
      className={`lg:hidden relative shrink-0 overflow-hidden
                  h-[clamp(220px,calc(100dvh_-_516px),360px)] sm:h-[clamp(320px,42dvh,520px)]
                  ${arrastrando ? '' : 'transition-[height] duration-300 ease-out'}`}
    >
      {/* Sol o luna asomando detrás del selector de tema */}
      {oscuro ? (
        <svg aria-hidden viewBox="0 0 100 100" className="absolute right-[40px] sm:right-[60px] top-[46px] size-[50px]">
          <path d="M62 4 A46 46 0 1 0 98 74 A40 40 0 1 1 62 4 Z" fill="#efcb68" />
        </svg>
      ) : (
        <div aria-hidden className="absolute right-[45px] sm:right-[65px] top-[52px] size-[56px] rounded-full bg-(--l-acento)" />
      )}

      <CieloMovil oscuro={oscuro} />

      {/* Edificio: la hoja del formulario tapa su parte de abajo */}
      <EscenaColegio
        tema={tema}
        recorte="44 100 690 380"
        conCielo={false}
        estilo={{ bottom: revelar, height: `calc(100% - ${84 + revelar}px)` }}
        className={`absolute left-0 sm:left-[12%] w-full sm:w-[76%]
                    ${arrastrando ? '' : 'transition-[bottom,height] duration-300 ease-out'}`}
      />

      <div className="relative flex items-center justify-between gap-3 px-5 sm:px-10 pt-10">
        <Marca compacto />
        <div className="relative -top-3.5">
          <SelectorTema tema={tema} onCambiar={onCambiarTema} />
        </div>
      </div>
    </header>
  )
}

/** Nubes (de día) o estrellas (de noche) sobre el edificio en celular. */
const ESTRELLAS_MOVIL: [number, number, number][] = [
  [244, 34, 1.4], [254, 50, 1.2], [332, 38, 1.2], [92, 88, 1.6], [112, 102, 1.2], [132, 106, 1.6],
  [152, 94, 1.2], [202, 90, 1.2], [234, 104, 1.6], [288, 100, 1.4], [270, 118, 1.2], [352, 116, 1.6],
  [30, 122, 1.2], [60, 100, 1.2], [372, 92, 1.2],
]

function CieloMovil({ oscuro }: { oscuro: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 390 330" preserveAspectRatio="xMidYMin meet" className="absolute inset-0 size-full [@media(max-height:700px)]:hidden">
      {oscuro ? (
        <g fill="#ffffff" fillOpacity=".7">
          {ESTRELLAS_MOVIL.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>
      ) : (
        <g className="fill-(--l-nube)">
          <rect x="150" y="85" width="75" height="17" rx="8.5" />
          <rect x="180" y="104" width="45" height="13" rx="6.5" />
        </g>
      )}
    </svg>
  )
}

function Marca({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className={`flex items-center ${compacto ? 'gap-2.5' : 'gap-3'}`}>
      <span
        className={`grid place-items-center shrink-0 rounded-full bg-[#170f27] text-white ring-(--l-acento) ${
          compacto ? 'size-10 ring-[2.5px]' : 'size-16 ring-[3px]'
        }`}
      >
        <LibroIcono tam={compacto ? 22 : 32} />
      </span>
      <div className={`leading-tight ${compacto ? 'whitespace-nowrap' : ''}`}>
        <p className={`font-bold ${compacto ? 'text-[15px]' : 'text-[17px]'}`}>Colegio Pedagógico</p>
        <p className={`text-(--l-suave) ${compacto ? 'text-[13px]' : 'text-[15px]'}`}>San Agustín</p>
      </div>
    </div>
  )
}

function SelectorTema({ tema, onCambiar }: { tema: Tema; onCambiar: (t: Tema) => void }) {
  const boton = (t: Tema, etiqueta: string, icono: ReactNode) => (
    <button
      type="button"
      onClick={() => onCambiar(t)}
      aria-label={etiqueta}
      aria-pressed={tema === t}
      className={`grid place-items-center h-9 w-10 min-[380px]:w-11 sm:w-[52px] rounded-full transition-colors ${
        tema === t ? 'bg-(--l-acento) text-[#170f27]' : 'text-(--l-suave) hover:text-(--l-tinta)'
      }`}
    >
      {icono}
    </button>
  )
  return (
    <div className="flex gap-1 rounded-full bg-(--l-campo) p-1 transition-colors">
      {boton('claro', 'Modo claro', <SolIcono />)}
      {boton('oscuro', 'Modo oscuro', <LunaIcono />)}
    </div>
  )
}

function Caja({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 h-[52px] lg:h-[64px] px-4 lg:px-5 rounded-2xl bg-(--l-campo) border-2 border-transparent
                 focus-within:border-(--l-acento) transition-colors"
    >
      <span className="text-(--l-suave)">{icono}</span>
      {children}
    </div>
  )
}

/* ── Ilustración: nubes y edificio del colegio ───────────────── */

const OSCURO = '#170f27'
const AMARILLO = '#efcb68'
const MENTA = '#e3efe6'
const BLANCO = '#ffffff'

function Persiana({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const lineas = []
  for (let ly = y + 6; ly < y + h - 3; ly += 8) {
    lineas.push(<rect key={ly} x={x + 6} y={ly} width={w - 12} height={4} fill={OSCURO} />)
  }
  return (
    <g>
      <rect x={x - 10} y={y - 14} width={w + 20} height={14} rx={2} fill={OSCURO} />
      <rect x={x} y={y} width={w} height={h} fill={BLANCO} />
      {lineas}
    </g>
  )
}

function Ventana({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const lineas = []
  for (let ly = y + 7; ly < y + h - 5; ly += 9) {
    lineas.push(<rect key={ly} x={x + 6} y={ly} width={w - 12} height={4} fill={BLANCO} />)
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={OSCURO} />
      {lineas}
    </g>
  )
}

function Arbol({ cx, copa }: { cx: number; copa: string }) {
  return (
    <g>
      <circle cx={cx} cy={248} r={36} fill={copa} />
      <path
        d={`M${cx} 322 V258 M${cx} 276 l-16 -18 M${cx} 276 l16 -18`}
        stroke={OSCURO}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={cx - 6} cy={326} r={16} fill={OSCURO} />
      <circle cx={cx + 20} cy={322} r={20} fill={OSCURO} />
    </g>
  )
}

/** Estrellas del modo oscuro: [x, y, radio] dentro de la escena. */
const ESTRELLAS: [number, number, number][] = [
  [40, 130, 1.2], [80, 150, 2], [104, 120, 1.4], [164, 92, 2], [126, 76, 2], [186, 82, 1.4],
  [282, 92, 2], [300, 96, 2], [342, 84, 1.4], [376, 64, 2], [404, 90, 1.2], [450, 80, 1.4],
  [490, 98, 2], [534, 72, 1.4], [586, 96, 2], [610, 94, 1.4], [654, 70, 2], [672, 102, 1.4],
  [700, 52, 1.2], [714, 6, 1.4], [560, 26, 1.2], [230, 36, 1.2],
]

function EscenaColegio({
  tema,
  recorte = '40 0 696 484',
  className = 'absolute inset-0 size-full',
  conCielo = true,
  estilo,
}: {
  tema: Tema
  recorte?: string
  className?: string
  estilo?: CSSProperties
  /** false = solo el edificio, sin nubes ni estrellas (en celular van aparte) */
  conCielo?: boolean
}) {
  const oscuro = tema === 'oscuro'
  const fachada = oscuro ? '#aeb6b1' : MENTA
  const festones = []
  for (let x = 72; x <= 584; x += 13) festones.push(<circle key={x} cx={x} cy={10} r={6} fill={OSCURO} />)

  return (
    <svg
      aria-hidden
      viewBox={recorte}
      preserveAspectRatio="xMidYMax meet"
      className={className}
      style={estilo}
    >
      {!conCielo ? null : oscuro ? (
        /* Estrellas */
        <g fill="#ffffff" fillOpacity=".7">
          {ESTRELLAS.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>
      ) : (
        /* Nubes */
        <g className="fill-(--l-nube)">
          <rect x="66" y="28" width="150" height="30" rx="15" />
          <rect x="116" y="68" width="96" height="26" rx="13" />
          <rect x="496" y="54" width="120" height="26" rx="13" />
        </g>
      )}

      <g transform="translate(56 110)">
        {/* Suelo: de día una línea blanca, de noche una acera gris */}
        {oscuro ? (
          <>
            <rect x="5" y="332" width="650" height="32" fill="#8f9994" />
            <rect x="5" y="332" width="650" height="6" fill="#c3cac6" />
          </>
        ) : (
          <rect x="5" y="332" width="650" height="12" fill={BLANCO} />
        )}

        {/* Fachada superior */}
        <rect x="72" y="22" width="512" height="158" fill={fachada} />
        {oscuro && (
          <>
            <rect x="200" y="22" width="114" height="34" fill={MENTA} />
            <rect x="72" y="160" width="68" height="20" fill={MENTA} />
          </>
        )}
        <rect x="72" y="22" width="128" height="78" fill={AMARILLO} />
        <rect x="314" y="22" width="96" height="158" fill={BLANCO} />
        <rect x="410" y="22" width="174" height="56" fill={AMARILLO} />
        <rect x="255" y="74" width="59" height="66" fill={OSCURO} />

        {/* Techo con festones */}
        {festones}
        <rect x="65" y="10" width="526" height="12" fill={OSCURO} />

        <Persiana x={135} y={64} w={120} h={52} />
        <Persiana x={397} y={64} w={120} h={52} />

        {/* Letrero */}
        <rect x="140" y="125" width="370" height="55" fill={BLANCO} />
        <text
          x="325"
          y="149"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontWeight="800"
          fontSize="17"
          fill={OSCURO}
        >
          COLEGIO PEDAGÓGICO SAN AGUSTÍN
        </text>
        <rect x="192" y="160" width="90" height="3" rx="1.5" fill="#adb5b0" />
        <rect x="200" y="167" width="44" height="3" rx="1.5" fill="#adb5b0" />
        <rect x="372" y="160" width="90" height="3" rx="1.5" fill="#adb5b0" />
        <rect x="372" y="167" width="44" height="3" rx="1.5" fill="#adb5b0" />
        <circle cx="327" cy="165" r="13" fill={OSCURO} stroke={AMARILLO} strokeWidth="3" />
        <path d="M320 160 q3.5 -1.5 7 0 v10 q-3.5 -1.5 -7 0 Z M327 160 q3.5 -1.5 7 0 v10 q-3.5 -1.5 -7 0 Z" fill={BLANCO} />

        {/* Fachada inferior */}
        <rect x="72" y="196" width="512" height="136" fill={fachada} />
        <rect x="85" y="196" width="145" height="40" fill={AMARILLO} />
        <rect x="85" y="280" width="80" height="52" fill={BLANCO} />
        {oscuro && (
          <>
            <rect x="165" y="280" width="76" height="52" fill={MENTA} />
            <rect x="367" y="196" width="66" height="26" fill={MENTA} />
          </>
        )}
        <rect x="367" y="240" width="206" height="92" fill={AMARILLO} />

        {/* Alero */}
        <rect x="52" y="180" width="553" height="16" rx="8" fill={OSCURO} />

        {/* Puerta */}
        <rect x="310" y="196" width="57" height="136" fill={OSCURO} />
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x="317" y={226 + i * 10} width="43" height="5" fill={BLANCO} />
        ))}

        <Ventana x={150} y={223} w={110} h={60} />
        <Ventana x={372} y={223} w={119} h={60} />

        <Arbol cx={42} copa={oscuro ? AMARILLO : MENTA} />
        <Arbol cx={615} copa={oscuro ? AMARILLO : MENTA} />
      </g>
    </svg>
  )
}

/* ── Íconos ──────────────────────────────────────────────────── */

const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function LibroIcono({ tam = 32 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5.5c2.8-1.2 5.8-1.1 8 .6v13c-2.2-1.6-5.2-1.8-8-.6Z" />
      <path d="M21 5.5c-2.8-1.2-5.8-1.1-8 .6v13c2.2-1.6 5.2-1.8 8-.6Z" />
    </svg>
  )
}

function LibroLinea() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...trazo} className="inline-block -mt-0.5 mr-1" aria-hidden>
      <path d="M2.5 5.5c3-1.4 6.2-1.4 9.5.4v13c-3.3-1.8-6.5-1.8-9.5-.4Z" />
      <path d="M21.5 5.5c-3-1.4-6.2-1.4-9.5.4v13c3.3-1.8 6.5-1.8 9.5-.4Z" />
    </svg>
  )
}

function UsuarioIcono() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" {...trazo} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function CandadoIcono() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" {...trazo} aria-hidden>
      <rect x="4.5" y="10" width="15" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function OjoIcono({ tachado }: { tachado: boolean }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" {...trazo} aria-hidden>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
      {tachado && <path d="M3 3l18 18" />}
    </svg>
  )
}

function FlechaIcono() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" {...trazo} strokeWidth={2.2} aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

function SolIcono() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" {...trazo} strokeWidth={2.2} aria-hidden>
      <circle cx="12" cy="12" r="6" />
    </svg>
  )
}

function LunaIcono() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" {...trazo} aria-hidden>
      <path d="M19 15.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 10.5Z" />
    </svg>
  )
}
