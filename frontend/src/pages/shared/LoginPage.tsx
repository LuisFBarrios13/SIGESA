// src/pages/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — brand / decorative */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-orange-900 p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-800/50" />
          <div className="absolute top-1/2 -right-24 w-72 h-72 rounded-full bg-primary/30" />
          <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-orange-800/40" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-orange-800 flex items-center justify-center shadow-lg mb-6">
            <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">SIGESA</h1>
          <p className="text-orange-200/70 text-sm font-medium uppercase tracking-widest mt-2">
            Sistema de Gestión Escolar
          </p>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: 'school', label: 'Gestión de Matrículas' },
            { icon: 'grade', label: 'Control Académico' },
            { icon: 'payments', label: 'Seguimiento Financiero' },
            { icon: 'family_restroom', label: 'Portal de Acudientes' },
          ].map(({ icon, label }) => (
            <div key={icon} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-800/60 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-200 text-xl">{icon}</span>
              </div>
              <span className="text-orange-100/80 text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="relative z-10 text-orange-200/40 text-xs">
          © {new Date().getFullYear()} SIGESA — Todos los derechos reservados
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-900 flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>
          <h1 className="text-3xl font-black text-orange-900">SIGESA</h1>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-on-surface">Bienvenido de vuelta</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-error-container rounded-lg border border-error/20">
                <span className="material-symbols-outlined text-error text-xl">error</span>
                <p className="text-sm text-error font-medium">{error}</p>
              </div>
            )}

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase"
              >
                Usuario
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
                  <span className="material-symbols-outlined text-xl">person</span>
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-white text-sm text-on-surface
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all
                    placeholder:text-stone-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase"
              >
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-outline-variant bg-white text-sm text-on-surface
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all
                    placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-on-surface transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-orange-900 text-white rounded-lg font-semibold text-sm
                hover:bg-primary transition-all shadow-md hover:shadow-lg
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">
                    progress_activity
                  </span>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Hint for acudientes */}
          <div className="mt-8 p-4 bg-secondary-container/20 rounded-xl border border-secondary/20">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0 mt-0.5">
                info
              </span>
              <div>
                <p className="text-xs font-semibold text-secondary">Acudientes</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Tu usuario y contraseña temporal es el número de identidad del estudiante
                  matriculado. Por seguridad, deberás cambiarla en tu primer acceso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;