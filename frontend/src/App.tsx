import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import { getToken, removeToken, tokenVencido } from './services/api'
import type { AuthUser } from './types/auth'

const USER_KEY = 'sigesa_user'

function usuarioGuardado(): AuthUser | null {
  const token = getToken()
  if (!token || tokenVencido(token)) return null
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')
  } catch {
    return null
  }
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(usuarioGuardado)

  if (!user) {
    return (
      <LoginPage
        onLogin={u => {
          localStorage.setItem(USER_KEY, JSON.stringify(u))
          setUser(u)
        }}
      />
    )
  }

  // Pantalla provisional hasta diseñar el panel de cada rol.
  return (
    <main className="min-h-dvh grid place-items-center bg-cielo-50 text-tinta p-6">
      <div className="text-center">
        <p className="text-2xl font-semibold">Hola, {user.nombre}</p>
        <p className="mt-1 text-tinta/70">Rol: {user.roles.join(', ')}</p>
        <button
          onClick={() => {
            removeToken()
            localStorage.removeItem(USER_KEY)
            setUser(null)
          }}
          className="mt-6 h-11 px-6 rounded-full bg-cielo-600 text-white font-semibold hover:bg-cielo-800"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  )
}
