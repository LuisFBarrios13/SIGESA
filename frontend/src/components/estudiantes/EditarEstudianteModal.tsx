// src/components/estudiantes/EditarEstudianteModal.tsx
// Single Responsibility: formulario de edición de datos de un estudiante.
// Open/Closed: los campos editables se declaran en CAMPOS_CONFIG — agregar
// un campo nuevo no requiere tocar la lógica del formulario.

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import type { EstudianteListItem, ActualizarEstudiantePayload } from '../../types/estudiantes';

// ── Campos editables ──────────────────────────────────────────

interface CampoConfig {
  key:         keyof ActualizarEstudiantePayload;
  label:       string;
  placeholder: string;
  type:        'text' | 'date' | 'select' | 'textarea';
  options?:    string[];
  required?:   boolean;
  colSpan?:    boolean;   // ocupa las 2 columnas
}

const CAMPOS_CONFIG: CampoConfig[] = [
  {
    key:         'nombre',
    label:       'Nombre completo',
    placeholder: 'Nombre y apellidos',
    type:        'text',
    required:    true,
    colSpan:     true,
  },
  {
    key:         'fecha_nacimiento',
    label:       'Fecha de nacimiento',
    placeholder: '',
    type:        'date',
    required:    true,
  },
  {
    key:         'rh',
    label:       'Tipo de sangre (RH)',
    placeholder: 'Seleccionar',
    type:        'select',
    options:     ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  {
    key:         'direccion',
    label:       'Dirección de residencia',
    placeholder: 'Calle, barrio, ciudad…',
    type:        'text',
    colSpan:     true,
  },
  {
    key:         'observaciones',
    label:       'Observaciones',
    placeholder: 'Condiciones médicas, necesidades especiales…',
    type:        'textarea',
    colSpan:     true,
  },
];

// ── Tipos locales ─────────────────────────────────────────────

type FormState = ActualizarEstudiantePayload;
type FormErrors = Partial<Record<keyof ActualizarEstudiantePayload, string>>;

interface EditarEstudianteModalProps {
  estudiante: EstudianteListItem;
  onConfirm:  (payload: ActualizarEstudiantePayload) => Promise<void>;
  onClose:    () => void;
  isLoading:  boolean;
  error:      string;
}

// ── Clases de input reutilizables ─────────────────────────────

const inputBase =
  'w-full px-3 py-2.5 rounded-lg border bg-white text-sm text-on-surface transition-all ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ' +
  'placeholder:text-stone-300';

const inputNormal  = `${inputBase} border-outline-variant`;
const inputInvalid = `${inputBase} border-error bg-error-container/10 focus:ring-error/30 focus:border-error`;

// ── Helper: valor inicial del formulario ──────────────────────

const buildInitialState = (e: EstudianteListItem): FormState => ({
  nombre:           e.nombre,
  fecha_nacimiento: e.fecha_nacimiento,
  rh:               e.rh               ?? '',
  direccion:        e.direccion         ?? '',
  observaciones:    e.observaciones     ?? '',
});

// ── Sub-componente: campo individual ──────────────────────────

interface FieldProps {
  config:   CampoConfig;
  value:    string;
  error?:   string;
  onChange: (key: keyof ActualizarEstudiantePayload, value: string) => void;
}

const Field = ({ config, value, error, onChange }: FieldProps) => {
  const { key, label, placeholder, type, options, required } = config;
  const cls = error ? inputInvalid : inputNormal;

  return (
    <div className={`flex flex-col gap-1.5 ${config.colSpan ? 'md:col-span-2' : ''}`}>
      <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      {type === 'select' && (
        <select
          value={value}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(key, e.target.value)}
          className={cls}
        >
          <option value="">Seleccionar</option>
          {options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}

      {type === 'textarea' && (
        <textarea
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(key, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${cls} resize-none`}
        />
      )}

      {(type === 'text' || type === 'date') && (
        <input
          type={type}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(key, e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}

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

const EditarEstudianteModal = ({
  estudiante,
  onConfirm,
  onClose,
  isLoading,
  error,
}: EditarEstudianteModalProps) => {
  const [form,   setForm]   = useState<FormState>(() => buildInitialState(estudiante));
  const [errors, setErrors] = useState<FormErrors>({});

  // Sincroniza si el prop cambia (p.ej. el padre abre el modal con otro estudiante)
  useEffect(() => {
    setForm(buildInitialState(estudiante));
    setErrors({});
  }, [estudiante]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleChange = (key: keyof ActualizarEstudiantePayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.nombre?.trim())           next.nombre           = 'El nombre es requerido';
    if (!form.fecha_nacimiento)          next.fecha_nacimiento  = 'La fecha de nacimiento es requerida';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Solo envía campos con valor (omite cadenas vacías para campos opcionales)
    const payload: ActualizarEstudiantePayload = {
      nombre:           form.nombre?.trim(),
      fecha_nacimiento: form.fecha_nacimiento,
      ...(form.rh            ? { rh:            form.rh }            : {}),
      ...(form.direccion     ? { direccion:      form.direccion }     : {}),
      ...(form.observaciones ? { observaciones:  form.observaciones } : {}),
    };

    await onConfirm(payload);
  };

  // ── Iniciales para el avatar ──────────────────────────────────

  const initials = estudiante.nombre
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ── Render ────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Editar datos de ${estudiante.nombre}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="bg-orange-900 px-6 py-5 flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-orange-800 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-black text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              Editar estudiante
            </h3>
            <p className="text-xs text-orange-200/70 truncate">
              CC {estudiante.numero_identidad} — los cambios se guardan inmediatamente
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cerrar modal"
            className="p-2 rounded-lg text-orange-200/70 hover:text-white hover:bg-orange-800/60
              transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* ── Formulario ─────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 p-6 space-y-5"
        >
          {/* Banner de error de la API */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-error-container rounded-xl border border-error/20">
              <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          )}

          {/* Campos (grid 2 columnas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAMPOS_CONFIG.map((cfg) => (
              <Field
                key={cfg.key}
                config={cfg}
                value={(form[cfg.key] as string) ?? ''}
                error={errors[cfg.key]}
                onChange={handleChange}
              />
            ))}
          </div>

          {/* Nota informativa sobre el ID */}
          <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <span className="material-symbols-outlined text-stone-400 text-lg flex-shrink-0 mt-0.5">
              info
            </span>
            <p className="text-xs text-stone-500">
              El número de identidad{' '}
              <strong className="text-on-surface font-mono">{estudiante.numero_identidad}</strong>
              {' '}no puede modificarse. Si necesitas corregirlo, comunícate con el administrador del sistema.
            </p>
          </div>
        </form>

        {/* ── Acciones (footer fijo) ──────────────────────────── */}
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
            type="submit"
            form=""          // referencia el <form> de arriba via onSubmit prop
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

export default EditarEstudianteModal;