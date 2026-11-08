// src/components/docente/DocenteSuccessModal.tsx
import type { DocenteListItem } from '../../services/api';

interface DocenteSuccessModalProps {
  data: DocenteListItem & {
    credenciales: { username: string; passwordTemporal: string; nota: string };
    gradosAsignados: { nombre: string; jornada: string }[];
  };
  onClose: () => void;
}
const DocenteSuccessModal = ({ data, onClose }: DocenteSuccessModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
      <div className="bg-secondary px-6 py-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-secondary-container/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">¡Docente registrado!</h3>
          <p className="text-xs text-white/70">{data.nombre} ha sido agregado al sistema</p>
        </div>
      </div>
      <div className="px-6 py-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Grados asignados</p>
          <div className="flex flex-wrap gap-2">
            {data.gradosAsignados.map((g) => (
              <span key={`${g.nombre}-${g.jornada}`}
                className="text-xs bg-secondary-container/20 text-secondary px-3 py-1 rounded-full font-medium">
                {g.nombre} – Jornada {g.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-stone-50 rounded-xl border border-stone-200 p-4">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Credenciales</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-stone-500">Usuario</span>
              <code className="text-sm font-bold bg-stone-200 px-2.5 py-1 rounded-lg">{data.credenciales.username}</code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-stone-500">Contraseña temporal</span>
              <code className="text-sm font-bold bg-stone-200 px-2.5 py-1 rounded-lg">{data.credenciales.passwordTemporal}</code>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
          <span className="material-symbols-outlined text-orange-700 text-xl flex-shrink-0">warning</span>
          <p className="text-xs text-orange-800">{data.credenciales.nota}</p>
        </div>
        <button onClick={onClose}
          className="w-full py-3 bg-orange-900 text-white rounded-lg font-semibold hover:bg-primary transition-all shadow-md">
          Registrar otro docente
        </button>
      </div>
    </div>
  </div>
);

export default DocenteSuccessModal;
