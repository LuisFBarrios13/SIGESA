import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
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
  const e = Math.min(ancho / DISENO.ancho, alto / DISENO.alto)
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

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [ayudaClave, setAyudaClave] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [tema, setTema] = useState<Tema>(temaGuardado)
  const escala = useEscala()

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
      className="login relative min-h-dvh overflow-hidden flex items-center justify-center
                 bg-(--l-caja) sm:bg-(--l-fondo) text-(--l-tinta) sm:p-[clamp(16px,4dvh,40px)] lg:p-0 transition-colors"
    >
      {/* Círculos decorativos de la página (desde tablet) */}
      <div aria-hidden className="hidden sm:block pointer-events-none">
        <div
          className="absolute rounded-full bg-(--l-circulo-1) transition-colors"
          style={{ top: -90 * escala, right: -110 * escala, width: 440 * escala, height: 440 * escala }}
        />
        <div
          className="absolute rounded-full bg-(--l-circulo-2) transition-colors"
          style={{ bottom: -120 * escala, left: -80 * escala, width: 400 * escala, height: 400 * escala }}
        />
      </div>

      {/* Caja: en celular ocupa toda la pantalla; en tablet es una tarjeta centrada;
          en computador mide 1380×920 como en el diseño y se escala con la pantalla */}
      <div
        style={escala !== 1 ? { zoom: escala } : undefined}
        className="relative w-full min-h-dvh sm:min-h-0 sm:max-w-[540px]
                   lg:w-[1380px] lg:max-w-none lg:h-[920px] lg:shrink-0
                   flex gap-6 p-4 sm:p-[clamp(16px,2.5dvh,24px)] lg:p-6 bg-(--l-caja)
                   sm:rounded-[40px] sm:border sm:border-(--l-borde) sm:shadow-2xl sm:shadow-black/10 transition-colors"
      >
      {/* Mitad izquierda: ilustración del colegio (solo en pantallas grandes) */}
      <PanelColegio tema={tema} />

      {/* Mitad derecha: formulario */}
      <main className="relative flex-1 flex flex-col sm:px-4">
        <div className="hidden lg:flex justify-end">
          <SelectorTema tema={tema} onCambiar={cambiarTema} />
        </div>

        <div className="flex-1 flex items-center justify-center py-[clamp(4px,2.5dvh,32px)] lg:py-8">
          <div className="w-full max-w-[460px]">
            {/* En pantallas pequeñas el panel izquierdo no se ve: mostramos la marca aquí */}
            <div className="lg:hidden mb-[clamp(16px,4dvh,40px)] flex items-center justify-between gap-3">
              <Marca />
              <SelectorTema tema={tema} onCambiar={cambiarTema} />
            </div>

            <p className="text-[13px] font-semibold tracking-[0.2em] text-(--l-suave)">
              SIGESA · PORTAL ESCOLAR
            </p>
            <h1 className="mt-3 text-[clamp(2.2rem,5.2dvh,2.75rem)] lg:text-[2.75rem] leading-tight font-extrabold tracking-tight">
              ¡Hola de nuevo!
            </h1>
            <p className="mt-2 text-[17px] text-(--l-suave)">Ingresa a tu cuenta para continuar.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-[clamp(16px,4.5dvh,44px)] space-y-[clamp(12px,2.6dvh,28px)] lg:mt-11 lg:space-y-7">
              <div>
                <label htmlFor="usuario" className="block mb-3 text-[15px] font-bold">
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
                    className="flex-1 min-w-0 bg-transparent text-[17px] outline-none placeholder:text-(--l-suave)/60"
                  />
                </Caja>
              </div>

              <div>
                <label htmlFor="clave" className="block mb-3 text-[15px] font-bold">
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
                    className="flex-1 min-w-0 bg-transparent text-[17px] outline-none placeholder:text-(--l-suave)/60"
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

                <div className="mt-[clamp(8px,2dvh,16px)] lg:mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAyudaClave(v => !v)}
                    aria-expanded={ayudaClave}
                    className="text-[15px] font-bold border-b-2 border-(--l-acento) hover:opacity-75"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                {ayudaClave && (
                  <p className="mt-3 rounded-xl bg-(--l-campo) px-5 py-3.5 text-[15px] text-(--l-suave)">
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
                className="w-full h-[clamp(52px,8.5dvh,66px)] lg:h-[66px] rounded-2xl bg-(--l-acento) text-[#170f27] text-lg font-bold
                           flex items-center justify-center gap-2.5
                           hover:brightness-105 active:scale-[0.99] transition
                           disabled:opacity-70 disabled:cursor-wait"
              >
                {enviando ? 'Ingresando…' : <>Ingresar <FlechaIcono /></>}
              </button>
            </form>

            <p className="mt-[clamp(16px,4.5dvh,44px)] lg:mt-11 text-center text-[15px] text-(--l-suave)">
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

function Marca() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid place-items-center size-16 rounded-full bg-[#170f27] ring-[3px] ring-(--l-acento) text-white">
        <LibroIcono />
      </span>
      <div className="leading-tight">
        <p className="text-[17px] font-bold">Colegio Pedagógico</p>
        <p className="text-[15px] text-(--l-suave)">San Agustín</p>
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
      className={`grid place-items-center h-9 w-11 sm:w-[52px] rounded-full transition-colors ${
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
      className="flex items-center gap-3 h-[clamp(50px,8dvh,64px)] lg:h-[64px] px-5 rounded-2xl bg-(--l-campo) border-2 border-transparent
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

function EscenaColegio({ tema }: { tema: Tema }) {
  const oscuro = tema === 'oscuro'
  const fachada = oscuro ? '#aeb6b1' : MENTA
  const festones = []
  for (let x = 72; x <= 584; x += 13) festones.push(<circle key={x} cx={x} cy={10} r={6} fill={OSCURO} />)

  return (
    <svg
      aria-hidden
      viewBox="40 0 696 484"
      preserveAspectRatio="xMidYMax meet"
      className="absolute inset-0 size-full"
    >
      {oscuro ? (
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

function LibroIcono() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5.5c2.8-1.2 5.8-1.1 8 .6v13c-2.2-1.6-5.2-1.8-8-.6Z" />
      <path d="M21 5.5c-2.8-1.2-5.8-1.1-8 .6v13c2.2-1.6 5.2-1.8 8-.6Z" />
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
