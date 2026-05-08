// src/pages/ChangePasswordPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ChangePasswordPage = () => {
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(newPassword);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-outline-variant overflow-hidden">
          {/* Header */}
          <div className="bg-orange-900 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">lock_reset</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Cambiar contraseña</h2>
                <p className="text-xs text-orange-200/70">Requerido en el primer acceso</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-7">
            {/* Info banner */}
            <div className="flex gap-3 p-4 bg-secondary-container/20 rounded-xl border border-secondary/20 mb-6">
              <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0">
                security
              </span>
              <p className="text-xs text-on-surface-variant">
                Por seguridad debes establecer una nueva contraseña personal. Elige una que no
                compartas con nadie.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-error-container rounded-lg border border-error/20 mb-5">
                <span className="material-symbols-outlined text-error text-xl">error</span>
                <p className="text-sm text-error font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                  Nueva contraseña *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </span>
                  <input
                    type={show ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-outline-variant bg-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all
                      placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {show ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                  Confirmar contraseña *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
                    <span className="material-symbols-outlined text-xl">lock_open</span>
                  </span>
                  <input
                    type={show ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all
                      placeholder:text-stone-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-orange-900 text-white rounded-lg font-semibold text-sm
                  hover:bg-primary transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Confirmar contraseña
                  </>
                )}
              </button>
            </form>

            <button
              onClick={logout}
              className="w-full mt-4 py-2.5 text-stone-500 text-sm hover:text-error transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;