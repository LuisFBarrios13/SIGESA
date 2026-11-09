// src/components/estudiantes/AcudientesPanel.tsx
import type { AcudienteDetalle } from '../../types/acudientes-admin';
import { iniciales } from '../../utils/iniciales';

interface AcudientesPanelProps {
  acudientes: AcudienteDetalle[];
  isLoading:  boolean;
  error:      string;
  onEditar:   (a: AcudienteDetalle) => void;
  colSpan:    number;
}

const AcudientesPanel = ({ acudientes, isLoading, error, onEditar, colSpan }: AcudientesPanelProps) => (
  <tr>
    <td colSpan={colSpan} className="px-0 py-0">
      <div className="bg-stone-50 border-y border-stone-200 px-8 py-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-stone-400 py-1">
            <span className="material-symbols-outlined text-primary animate-spin text-lg">progress_activity</span>
            <span className="text-sm">Cargando acudientes…</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-error-container rounded-lg border border-error/20">
            <span className="material-symbols-outlined text-error text-lg">error</span>
            <p className="text-xs text-error font-medium">{error}</p>
          </div>
        )}
        {!isLoading && !error && acudientes.length === 0 && (
          <p className="text-xs text-stone-400 italic py-1">Sin acudientes registrados.</p>
        )}
        {!isLoading && acudientes.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
              Acudiente{acudientes.length !== 1 ? 's' : ''}
            </p>
            {acudientes.map((a) => {
              const initials = iniciales(a.nombre);
              return (
                <div key={a.cedula}
                  className="bg-white rounded-xl border border-outline-variant p-4
                    flex items-center gap-4 group">
                  <div className="w-9 h-9 rounded-full bg-secondary-container/30
                    flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-secondary">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-0.5">
                    <div>
                      <p className="font-semibold text-on-surface text-sm truncate">{a.nombre}</p>
                      <p className="text-xs text-stone-400 font-mono">CC {a.cedula}</p>
                    </div>
                    <div className="text-xs text-stone-500 space-y-0.5">
                      {a.telefono && (
                        <p className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-stone-400">phone</span>
                          {a.telefono}
                        </p>
                      )}
                      {a.correo && (
                        <p className="flex items-center gap-1 truncate">
                          <span className="material-symbols-outlined text-[13px] text-stone-400">mail</span>
                          {a.correo}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 space-y-0.5">
                      {a.RelacionEA?.parentesco && (
                        <p className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-stone-400">family_restroom</span>
                          {a.RelacionEA.parentesco}
                        </p>
                      )}
                      {a.RelacionEA?.acudiente_principal && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold
                          px-2 py-0.5 bg-secondary-container/30 text-secondary rounded-full">
                          <span className="material-symbols-outlined text-[11px]">star</span>Principal
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => onEditar(a)} title="Editar acudiente"
                    className="p-1.5 rounded-lg text-stone-300 hover:text-primary
                      hover:bg-primary-fixed/30 transition-all flex-shrink-0
                      opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </td>
  </tr>
);

export default AcudientesPanel;
