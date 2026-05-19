// src/components/docentes/EditarDocenteModal.tsx
// Single Responsibility: formulario de edición de datos personales del docente.
// Open/Closed: campos declarados en CAMPOS_CONFIG, extensible sin tocar la lógica.

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import type { DocenteListItem, ActualizarDocentePayload } from '../../types/docentes';

// ── Configuración de campos editables ────────────────────────

interface CampoConfig {
  key:         keyof ActualizarDocentePayload;
  label:       string;
  placeholder: string;
  type:        'text' | 'email' | 'tel';
  icon:        string;
  required?:   boolean;
}

const CAMPOS_CONFIG: CampoConfig[] = [
  {
    key:         'nombre',
    label:       'Nombre completo',
    placeholder: 'Nombre y apellidos',
    type:        'text',
    icon:        'person',
    required:    true,
  },
  {
    key:         'telefono',
    label:       'Teléfono',
    placeholder: 'ej. 3001234567',
    type:        'tel',
    icon:        'phone',
  },
  {
    key:         'correo',
    label:       'Correo electrónico',
    placeholder: 'correo@escuela.edu.co',
    type:        'email',
    icon:        'mail',
  },
];

// ── Tipos locales ─────────────────────────────────────────────

type FormState  = ActualizarDocentePayload;
type FormErrors = Partial<Record<keyof ActualizarDocentePayload, string>>;

export interface EditarDocenteModalProps {
  docente:    DocenteListItem;
  onConfirm:  (payload: ActualizarDocentePayload) => Promise<void>;
  onClose:    () => void;
  isLoading:  boolean;
  error:      string;
}

// ── Clases de input ───────────────────────────────────────────

const inputBase =
  'w-full pl-9 pr-3 py-2.5 rounded-lg border bg-white text-sm text-on-surface transition-all ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ' +
  'placeholder:text-stone-300';

const inputNormal  = `${inputBase} border-outline-variant`;
const inputInvalid =
  `${inputBase} border-error bg-error-container/10 focus:ring-error/30 focus:border-error`;

// ── Etiqueta de jornada ───────────────────────────────────────

const JORNADA_LABEL: Record<string, string> = {
  MAÑANA:   'Mañana',
  TARDE:    'Tarde',
  COMPLETA: 'Completa',
};

const JORNADA_COLOR: Record<string, string> = {
  MAÑANA:   'bg-amber-100 text-amber-800',
  TARDE:    'bg-indigo-100 text-indigo-800',
  COMPLETA: 'bg-emerald-100 text-emerald-800',
};

// ── Valor inicial ─────────────────────────────────────────────

const buildInitialState = (d: DocenteListItem): FormState => ({
  nombre:   d.nombre,
  telefono: d.telefono  ?? '',
  correo:   d.correo    ?? '',
});

// ── Sub-componente: campo individual ──────────────────────────

interface FieldProps {
  config:   CampoConfig;
  value:    string;
  error?:   string;
  onChange: (key: keyof ActualizarDocentePayload, value: string) => void;
}

const Field = ({ config, value, error, onChange }: FieldProps) => {
  const { key, label, placeholder, type, icon, required } = config;
  const cls = error ? inputInvalid : inputNormal;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 pointer-events-none">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </span>
        <input
          type={type}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(key, e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      </div>
      {error && (
        <p className="text-xs text-error font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
};

// ── Modal principal ───────────────────────────────────────────

const EditarDocenteModal = ({
  docente,
  onConfirm,
  onClose,
  isLoading,
  error,
}: EditarDocenteModalProps) => {
  const [form,   setForm]   = useState<FormState>(() => buildInitialState(docente));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setForm(buildInitialState(docente));
    setErrors({});
  }, [docente]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleChange = (key: keyof ActualizarDocentePayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.nombre?.trim()) next.nombre = 'El nombre es requerido';
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      next.correo = 'Ingresa un correo válido';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: ActualizarDocentePayload = {
      nombre:   form.nombre?.trim(),
      ...(form.telefono ? { telefono: form.telefono.trim() } : {}),
      ...(form.correo   ? { correo:   form.correo.trim()   } : {}),
    };

    await onConfirm(payload);
  };

  const initials = docente.nombre
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Editar docente ${docente.nombre}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md
        overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="bg-orange-900 px-6 py-5 flex items-center gap-4 flex-shrink-0">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-orange-800 flex items-center justify-center">
              <span className="text-sm font-black text-white">{initials}</span>
            </div>
            {/* Ícono de docente */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary
              flex items-center justify-center border-2 border-orange-900">
              <span className="material-symbols-outlined text-white text-[11px]">person_book</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">Editar docente</h3>
            <p className="text-xs text-orange-200/70 truncate">
              CC {docente.cedula}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cerrar"
            className="p-2 rounded-lg text-orange-200/70 hover:text-white hover:bg-orange-800/60
              transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* ── Formulario ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Error de la API */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-error-container rounded-xl border border-error/20">
              <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          )}

          {/* Campos editables */}
          {CAMPOS_CONFIG.map((cfg) => (
            <Field
              key={cfg.key}
              config={cfg}
              value={(form[cfg.key] as string) ?? ''}
              error={errors[cfg.key]}
              onChange={handleChange}
            />
          ))}

          {/* Datos no editables: jornada y grados */}
          <div className="pt-1 border-t border-stone-100 space-y-3">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Datos no modificables
            </p>

            {/* Jornada */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-stone-50
              rounded-lg border border-stone-200">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                Jornada laboral
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                ${JORNADA_COLOR[docente.jornada] ?? 'bg-stone-100 text-stone-700'}`}>
                {JORNADA_LABEL[docente.jornada] ?? docente.jornada}
              </span>
            </div>

            {/* Grados */}
            {docente.grados.length > 0 && (
              <div className="px-3 py-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  Grado{docente.grados.length !== 1 ? 's' : ''} asignado{docente.grados.length !== 1 ? 's' : ''}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {docente.grados.map((g) => (
                    <span key={g.id_grado}
                      className="text-[11px] font-semibold bg-white border border-stone-200
                        text-stone-600 px-2 py-0.5 rounded-full">
                      {g.nombre} – {g.jornada === 'MAÑANA' ? 'M' : 'T'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Nota informativa */}
            <div className="flex items-start gap-2 text-xs text-stone-400">
              <span className="material-symbols-outlined text-[14px] flex-shrink-0 mt-0.5">info</span>
              <p>
                Para cambiar la jornada o los grados asignados, desvincula al docente y
                regístralo nuevamente con la configuración correcta.
              </p>
            </div>
          </div>
        </form>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-stone-100 flex gap-3 flex-shrink-0 bg-stone-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant bg-white
              rounded-lg font-semibold text-sm hover:bg-stone-50 transition-all disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-orange-900 text-white rounded-lg font-semibold text-sm
              hover:bg-primary transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Guardando…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span>
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarDocenteModal;