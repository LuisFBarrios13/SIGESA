// src/components/ui/CredencialesModal.tsx
// Muestra el usuario y la contraseña temporal tras restablecer una contraseña.
import type { Credenciales } from '../../types/shared';

interface CredencialesModalProps {
  nombre:       string;
  credenciales: Credenciales;
  onClose:      () => void;
}

const CredencialesModal = ({ nombre, credenciales, onClose }: CredencialesModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
    <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
      <div className="bg-secondary px-6 py-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-secondary-container/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-2xl">key</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white">Contraseña restablecida</h3>
          <p className="text-xs text-white/70 truncate">{nombre}</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-stone-500">Usuario</span>
            <code className="text-sm font-bold bg-stone-200 px-2.5 py-1 rounded-lg">{credenciales.username}</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-stone-500">Contraseña temporal</span>
            <code className="text-sm font-bold bg-stone-200 px-2.5 py-1 rounded-lg">{credenciales.passwordTemporal}</code>
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
          <span className="material-symbols-outlined text-orange-700 text-xl flex-shrink-0">info</span>
          <p className="text-xs text-orange-800">{credenciales.nota}</p>
        </div>
        <button onClick={onClose}
          className="w-full py-3 bg-orange-900 text-white rounded-lg font-semibold hover:bg-primary transition-all shadow-md">
          Entendido
        </button>
      </div>
    </div>
  </div>
);

export default CredencialesModal;
