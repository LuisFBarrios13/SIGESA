// src/components/estudiantes/EditarAcudienteModal.tsx
// Single Responsibility: formulario de edición de datos de un acudiente.
// Open/Closed: campos declarados en CAMPOS_CONFIG — extensible sin tocar la lógica.

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import type { AcudienteDetalle, ActualizarAcudientePayload } from '../../types/acudientes-admin';

// ── Configuración de campos ───────────────────────────────────

interface CampoConfig {
  key:         keyof ActualizarAcudientePayload;
  label:       string;
  placeholder: string;
  type:        'text' | 'email' | 'tel';
  required?:   boolean;
  colSpan?:    boolean;
  icon:        string;
}

const CAMPOS_CONFIG: CampoConfig[] = [
  {
    key:         'nombre',
    label:       'Nombre completo',
    placeholder: 'Nombre y apellidos',
    type:        'text',
    required:    true,
    colSpan:     true,
    icon:        'person',
  },
  {
    key:         'telefono',
    label:       'Teléfono personal',
    placeholder: 'ej. 3001234567',
    type:        'tel',
    icon:        'phone',
  },
  {
    key:         'correo',
    label:       'Correo electrónico',
    placeholder: 'correo@ejemplo.com',
    type:        'email',
    icon:        'mail',
  },
  {
    key:         'direccion',
    label:       'Dirección de residencia',
    placeholder: 'Calle, barrio, ciudad…',
    type:        'text',
    colSpan:     true,
    icon:        'home',
  },
  {
    key:         'telefono_trabajo',
    label:       'Teléfono del trabajo',
    placeholder: 'ej. 6012345678',
    type:        'tel',
    icon:        'work',
  },
  {
    key:         'direccion_trabajo',
    label:       'Dirección del trabajo',
    placeholder: 'Empresa, dirección…',
    type:        'text',
    icon:        'corporate_fare',
  },
];

// ── Tipos locales ─────────────────────────────────────────────

type FormState  = ActualizarAcudientePayload;
type FormErrors = Partial<Record<keyof ActualizarAcudientePayload, string>>;

export interface EditarAcudienteModalProps {
  acudiente:  AcudienteDetalle;
  /** Nombre del estudiante vinculado (para el encabezado) */
  nombreEstudiante: string;
  onConfirm:  (payload: ActualizarAcudientePayload) => Promise<void>;
  onClose:    () => void;
  isLoading:  boolean;
  error:      string;
}

// ── Helpers de estilos ────────────────────────────────────────

const inputBase =
  'w-full pl-9 pr-3 py-2.5 rounded-lg border bg-white text-sm text-on-surface transition-all ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ' +
  'placeholder:text-stone-300';

const inputNormal  = `${inputBase} border-outline-variant`;
const inputInvalid =
  `${inputBase} border-error bg-error-container/10 focus:ring-error/30 focus:border-error`;

// ── Valor inicial del formulario ──────────────────────────────

const buildInitialState = (a: AcudienteDetalle): FormState => ({
  nombre:            a.nombre,
  telefono:          a.telefono          ?? '',
  correo:            a.correo            ?? '',
  direccion:         a.direccion         ?? '',
  telefono_trabajo:  a.telefono_trabajo  ?? '',
  direccion_trabajo: a.direccion_trabajo ?? '',
});

// ── Sub-componente: campo individual ──────────────────────────

interface FieldProps {
  config:   CampoConfig;
  value:    string;
  error?:   string;
  onChange: (key: keyof ActualizarAcudientePayload, value: string) => void;
}

const Field = ({ config, value, error, onChange }: FieldProps) => {
  const { key, label, placeholder, type, required, icon } = config;
  const cls = error ? inputInvalid : inputNormal;

  return (
    <div className={`flex flex-col gap-1.5 ${config.colSpan ? 'md:col-span-2' : ''}`}>
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

const EditarAcudienteModal = ({
  acudiente,
  nombreEstudiante,
  onConfirm,
  onClose,
  isLoading,
  error,
}: EditarAcudienteModalProps) => {
  const [form,   setForm]   = useState<FormState>(() => buildInitialState(acudiente));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setForm(buildInitialState(acudiente));
    setErrors({});
  }, [acudiente]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleChange = (key: keyof ActualizarAcudientePayload, value: string) => {
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

    // Solo envía los campos con valor; los opcionales vacíos se omiten
    const payload: ActualizarAcudientePayload = {
      nombre: form.nombre?.trim(),
      ...(form.telefono          ? { telefono:          form.telefono.trim()          } : {}),
      ...(form.correo            ? { correo:            form.correo.trim()            } : {}),
      ...(form.direccion         ? { direccion:         form.direccion.trim()         } : {}),
      ...(form.telefono_trabajo  ? { telefono_trabajo:  form.telefono_trabajo.trim()  } : {}),
      ...(form.direccion_trabajo ? { direccion_trabajo: form.direccion_trabajo.trim() } : {}),
    };

    await onConfirm(payload);
  };

  // Iniciales del acudiente para el avatar
  const initials = acudiente.nombre
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Editar acudiente ${acudiente.nombre}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-xl
        overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="bg-orange-900 px-6 py-5 flex items-center gap-4 flex-shrink-0">
          {/* Avatar acudiente */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-orange-800 flex items-center justify-center">
              <span className="text-sm font-black text-white">{initials}</span>
            </div>
            {/* Badge de rol */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary
              flex items-center justify-center border-2 border-orange-900">
              <span className="material-symbols-outlined text-white text-[11px]">family_restroom</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">Editar acudiente</h3>
            <p className="text-xs text-orange-200/70 truncate">
              CC {acudiente.cedula} · Acudiente de{' '}
              <span className="font-semibold text-orange-100">{nombreEstudiante}</span>
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
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Error de la API */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-error-container rounded-xl border border-error/20">
              <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          )}

          {/* Sección: datos personales */}
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3
              flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">person</span>
              Datos personales
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAMPOS_CONFIG.filter((c) => ['nombre', 'telefono', 'correo', 'direccion'].includes(c.key)).map((cfg) => (
                <Field
                  key={cfg.key}
                  config={cfg}
                  value={(form[cfg.key] as string) ?? ''}
                  error={errors[cfg.key]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-stone-100" />

          {/* Sección: datos laborales */}
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3
              flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">work</span>
              Datos laborales <span className="font-normal normal-case tracking-normal">(opcionales)</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAMPOS_CONFIG.filter((c) => ['telefono_trabajo', 'direccion_trabajo'].includes(c.key)).map((cfg) => (
                <Field
                  key={cfg.key}
                  config={cfg}
                  value={(form[cfg.key] as string) ?? ''}
                  error={errors[cfg.key]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </div>

          {/* Nota informativa sobre la cédula */}
          <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <span className="material-symbols-outlined text-stone-400 text-lg flex-shrink-0 mt-0.5">info</span>
            <p className="text-xs text-stone-500">
              La cédula{' '}
              <strong className="text-on-surface font-mono">{acudiente.cedula}</strong>
              {' '}es el identificador del acudiente y no puede modificarse.
            </p>
          </div>
        </form>

        {/* ── Footer con acciones ─────────────────────────────── */}
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

export default EditarAcudienteModal;