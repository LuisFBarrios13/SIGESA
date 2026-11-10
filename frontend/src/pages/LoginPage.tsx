import { useState, type FormEvent, type ReactNode } from 'react'
import { authApi, saveToken } from '../services/api'
import type { AuthUser } from '../types/auth'

interface Props {
  onLogin: (user: AuthUser) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [ayudaClave, setAyudaClave] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

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
    <div className="relative min-h-dvh overflow-hidden bg-[#e4f1fb] flex items-center justify-center p-4 sm:p-8">
      {/* Manchas difuminadas del fondo */}
      <FondoPagina />

      <div className="relative w-full max-w-[1125px] lg:h-[min(670px,calc(100dvh-4rem))] flex flex-col lg:flex-row rounded-[28px] overflow-hidden bg-white shadow-2xl shadow-cielo-900/25">
        {/* Mitad izquierda: bienvenida */}
        <section className="relative lg:basis-[54%] shrink-0 text-white flex flex-col px-8 py-8 sm:px-14 sm:py-12 bg-linear-to-br from-cielo-600 to-cielo-900">
          <FondoDecorado />

          <img
            src="/logito.webp"
            alt="Logo de SIGESA"
            className="relative size-20 sm:size-[150px] rounded-[22%] shadow-xl shadow-cielo-900/35"
          />

          <div className="relative mt-8 lg:mt-auto">
            <h2 className="text-3xl sm:text-[2.9rem] font-extrabold leading-[1.08] tracking-tight">
              Bienvenido
              <br />
              de vuelta
            </h2>
            <p className="mt-4 max-w-sm text-base sm:text-lg text-white/85">
              Estudiamos con amor para un futuro mejor.
            </p>
          </div>

          <div className="relative mt-8 lg:mt-auto lg:pt-16">
            <p className="text-sm font-bold">SIGESA</p>
            <p className="text-xs text-white/70">Colegio Pedagógico San Agustín</p>
          </div>
        </section>

        {/* Mitad derecha: formulario */}
        <section className="flex-1 flex items-center justify-center px-6 py-10 sm:px-14">
          <div className="w-full max-w-[430px]">
            <h1 className="text-[2rem] font-bold tracking-tight text-tinta">Iniciar sesión</h1>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label htmlFor="usuario" className="block mb-2 text-sm font-semibold text-tinta">
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
                    className="campo"
                  />
                </Caja>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="clave" className="text-sm font-semibold text-tinta">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setAyudaClave(v => !v)}
                    className="text-xs font-semibold text-cielo-600 hover:text-cielo-800"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Caja icono={<CandadoIcono />}>
                  <input
                    id="clave"
                    type={verClave ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="campo"
                  />
                  <button
                    type="button"
                    onClick={() => setVerClave(v => !v)}
                    aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="p-1 text-tinta/50 hover:text-tinta"
                  >
                    <OjoIcono tachado={verClave} />
                  </button>
                </Caja>
                {ayudaClave && (
                  <p className="mt-2 rounded-lg bg-cielo-50 px-3 py-2 text-xs text-tinta/70">
                    Pídele al administrador del colegio que te asigne una contraseña nueva.
                  </p>
                )}
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full h-[52px] rounded-xl font-semibold text-white
                           bg-linear-to-r from-cielo to-cielo-900
                           shadow-lg shadow-cielo/30 hover:shadow-cielo/45 hover:brightness-110
                           active:scale-[0.99] transition disabled:opacity-70 disabled:cursor-wait"
              >
                {enviando ? 'Ingresando…' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="mt-8 text-center text-[13px] text-tinta/60">
              ¿No tienes acceso? <span className="font-semibold text-cafe">Comunícate con el administrador</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

function Caja({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 h-[52px] px-4 rounded-xl border-2 border-tinta/10 bg-white
                    focus-within:border-cielo focus-within:ring-4 focus-within:ring-cielo/15 transition">
      <span className="text-tinta/45">{icono}</span>
      {children}
    </div>
  )
}

/** Figuras detrás de la tarjeta: suaves pero con bordes que se distinguen. */
function FondoPagina() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 blur-[3px]">
      <div className="absolute -left-[12%] -top-[22%] w-[48%] aspect-square rounded-[46%_54%_42%_58%] bg-dorado/40" />
      <div className="absolute left-[30%] -top-[30%] w-[38%] aspect-square rounded-full bg-cielo/25" />
      <div className="absolute -right-[10%] -top-[8%] w-[30%] aspect-square rounded-[58%_42%_50%_50%] bg-dorado/30" />
      <div className="absolute -right-[14%] top-[38%] w-[34%] aspect-square rounded-full bg-cielo/35" />
      <div className="absolute -left-[10%] bottom-[-26%] w-[36%] aspect-square rounded-full bg-cielo/35" />
      <div className="absolute left-[38%] -bottom-[34%] w-[34%] aspect-square rounded-[50%_50%_44%_56%] bg-dorado/40" />
      <div className="absolute right-[6%] -bottom-[18%] w-[16%] aspect-square rounded-full bg-cafe/20" />
    </div>
  )
}

/** Formas de fondo de la mitad izquierda, con la paleta del colegio. */
function FondoDecorado() {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 size-full"
      viewBox="0 0 600 670"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="ola" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f5c86" />
          <stop offset="1" stopColor="#102f47" />
        </linearGradient>
        <pattern id="rayas" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
          <line x1="0" y1="0" x2="14" y2="0" stroke="#F8D020" strokeOpacity=".45" strokeWidth="2" />
        </pattern>
        <pattern id="rayas-claras" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(55)">
          <line x1="0" y1="0" x2="12" y2="0" stroke="#ffffff" strokeOpacity=".18" strokeWidth="2" />
        </pattern>
      </defs>

      {/* Ola oscura de la derecha */}
      <path d="M270 0 C230 120 330 230 420 300 C510 370 470 470 520 560 C545 610 600 640 600 670 L600 0 Z" fill="url(#ola)" />

      {/* Mancha dorada superior */}
      <path d="M-20 -20 L440 -20 C450 60 420 140 340 170 C260 200 200 150 130 180 C70 205 20 200 -20 190 Z" fill="#F8D020" fillOpacity=".88" />

      {/* Triángulos verdes arriba */}
      <g fill="#00A048" fillOpacity=".75">
        <path d="M335 140 l25 -38 l25 38 Z" />
        <path d="M388 140 l25 -38 l25 38 Z" />
        <path d="M441 140 l25 -38 l25 38 Z" />
      </g>

      {/* Círculo de rayas */}
      <circle cx="510" cy="215" r="80" fill="url(#rayas)" />

      {/* Líneas diagonales a la izquierda */}
      <rect x="0" y="210" width="190" height="170" fill="url(#rayas-claras)" />

      {/* Círculo dorado en el borde derecho */}
      <circle cx="610" cy="390" r="75" fill="#F8D020" fillOpacity=".9" />

      {/* Medio círculo café a la izquierda */}
      <circle cx="-40" cy="560" r="85" fill="#96502F" fillOpacity=".92" />
      <circle cx="-40" cy="560" r="85" fill="url(#rayas-claras)" />

      {/* Gota café junto al círculo de rayas */}
      <circle cx="420" cy="262" r="16" fill="#96502F" />

      {/* Triángulos dorados tipo "play" */}
      <g fill="#F8D020" fillOpacity=".85">
        <path d="M530 490 l36 20 l-36 20 Z" />
        <path d="M538 540 l36 20 l-36 20 Z" />
        <path d="M530 590 l36 20 l-36 20 Z" fillOpacity=".55" />
      </g>

      {/* Mancha dorada inferior */}
      <path d="M300 670 C310 610 360 580 420 590 C480 600 520 560 560 560 C590 560 600 580 600 600 L600 670 Z" fill="#F8D020" fillOpacity=".85" />
      <rect x="280" y="600" width="140" height="70" fill="url(#rayas-claras)" />

      {/* Triángulos verdes abajo a la izquierda */}
      <g fill="#96502F" className="max-lg:hidden">
        <path d="M60 500 l25 -36 l25 36 Z" />
        <path d="M112 500 l25 -36 l25 36 Z" />
        <path d="M164 500 l25 -36 l25 36 Z" />
      </g>
    </svg>
  )
}

const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function UsuarioIcono() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...trazo} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function CandadoIcono() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...trazo} aria-hidden>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function OjoIcono({ tachado }: { tachado: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...trazo} aria-hidden>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {tachado && <path d="M3 3l18 18" />}
    </svg>
  )
}
