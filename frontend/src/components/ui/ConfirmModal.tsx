// src/components/ui/ConfirmModal.tsx
// Diálogo de confirmación para acciones importantes (retirar, restablecer…).
import type { ReactNode } from 'react';

interface ConfirmModalProps {
  titulo:        string;
  icono:         string;
  children:      ReactNode;
  confirmar:     string;
  peligro?:      boolean;
  isLoading:     boolean;
  error:         string;
  onConfirm:     () => void;
  onClose:       () => void;
}

const ConfirmModal = ({
  titulo, icono, children, confirmar, peligro = false, isLoading, error, onConfirm, onClose,
}: ConfirmModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
    <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
      <div className="px-6 pt-6 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
          ${peligro ? 'bg-red-100 text-red-700' : 'bg-primary-fixed text-primary'}`}>
          <span className="material-symbols-outlined text-2xl">{icono}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-on-surface">{titulo}</h3>
          <div className="text-sm text-stone-600 mt-1 space-y-2">{children}</div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-error-container rounded-lg border border-error/20">
          <span className="material-symbols-outlined text-error text-lg">error</span>
          <p className="text-xs text-error font-medium">{error}</p>
        </div>
      )}

      <div className="px-6 py-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={isLoading}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors">
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={isLoading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm
            transition-all disabled:opacity-50
            ${peligro ? 'bg-red-700 hover:bg-red-800' : 'bg-primary hover:opacity-90'}`}>
          {isLoading && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
          {confirmar}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
