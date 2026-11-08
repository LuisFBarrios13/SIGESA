// src/components/matricula/MatriculaSuccessModal.tsx

interface MatriculaSuccessModalProps {
  credenciales:   { username: string | null; passwordTemporal: string | null; nota: string };
  acudienteNuevo: boolean;
  onClose:        () => void;
}

const MatriculaSuccessModal = ({ credenciales, acudienteNuevo, onClose }: MatriculaSuccessModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
      <div className="bg-secondary px-6 py-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-secondary-container/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">¡Matrícula creada!</h3>
          <p className="text-xs text-on-secondary/70">El estudiante ha sido matriculado exitosamente</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {acudienteNuevo && credenciales.username ? (
          <>
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-4">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
                Credenciales del acudiente
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-500">Usuario</span>
                  <code className="text-sm font-bold text-on-surface bg-stone-200 px-2.5 py-1 rounded-lg">
                    {credenciales.username}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-500">Contraseña temporal</span>
                  <code className="text-sm font-bold text-on-surface bg-stone-200 px-2.5 py-1 rounded-lg">
                    {credenciales.passwordTemporal}
                  </code>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
              <span className="material-symbols-outlined text-orange-700 text-xl flex-shrink-0">warning</span>
              <p className="text-xs text-orange-800">{credenciales.nota}</p>
            </div>
          </>
        ) : (
          <div className="flex gap-3 p-4 bg-secondary-container/20 rounded-xl border border-secondary/20">
            <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0">link</span>
            <p className="text-sm text-on-surface-variant">{credenciales.nota}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-orange-900 text-white rounded-lg font-semibold hover:bg-primary transition-all shadow-md"
        >
          Crear otra matrícula
        </button>
      </div>
    </div>
  </div>
);

export default MatriculaSuccessModal;
