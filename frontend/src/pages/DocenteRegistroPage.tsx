// src/pages/DocenteRegistroPage.tsx
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { docentesApi, type DocentePayload, type DocenteData, type JornadaDocente } from '../services/api';
import FormField, { inputClass } from '../components/ui/FormField';
import SectionCard from '../components/ui/SectionCard';

// ── Jornada selector ──────────────────────────────────────────

interface JornadaOptionProps {
  value: JornadaDocente;
  label: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelect: (v: JornadaDocente) => void;
}

const JornadaOption = ({ value, label, description, icon, selected, onSelect }: JornadaOptionProps) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all
      ${selected
        ? 'border-primary bg-primary-fixed/20 shadow-sm'
        : 'border-outline-variant bg-white hover:border-primary/40 hover:bg-stone-50'
      }`}
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
      ${selected ? 'bg-primary text-white' : 'bg-stone-100 text-stone-400'}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </div>
    <div className="min-w-0">
      <p className={`font-semibold text-sm truncate ${selected ? 'text-primary' : 'text-on-surface'}`}>
        {label}
      </p>
      <p className="text-[11px] text-on-surface-variant mt-0.5">{description}</p>
    </div>
    {selected && (
      <span className="material-symbols-outlined text-primary ml-auto flex-shrink-0 text-xl">
        check_circle
      </span>
    )}
  </button>
);

const JORNADA_OPTIONS: { value: JornadaDocente; label: string; description: string; icon: string }[] = [
  { value: 'MAÑANA',   label: 'Mañana',   description: '6:00 a.m. – 12:00 m.',  icon: 'wb_sunny'    },
  { value: 'TARDE',    label: 'Tarde',    description: '12:00 m. – 6:00 p.m.',  icon: 'wb_twilight' },
  { value: 'COMPLETA', label: 'Completa', description: 'Mañana y tarde',         icon: 'brightness_5' },
];

// ── Success modal ─────────────────────────────────────────────

interface SuccessModalProps {
  creds: { username: string; passwordTemporal: string; nota: string };
  nombre: string;
  onClose: () => void;
}

const SuccessModal = ({ creds, nombre, onClose }: SuccessModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
      <div className="bg-secondary px-6 py-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">¡Docente registrado!</h3>
          <p className="text-xs text-white/70 truncate max-w-[220px]">{nombre}</p>
        </div>
      </div>
      <div className="px-6 py-6 space-y-4">
        <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Credenciales de acceso
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-stone-500">Usuario</span>
            <code className="text-sm font-bold bg-stone-200 px-2.5 py-1 rounded-lg">
              {creds.username}
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-stone-500">Contraseña temporal</span>
            <code className="text-sm font-bold bg-stone-200 px-2.5 py-1 rounded-lg">
              {creds.passwordTemporal}
            </code>
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
          <span className="material-symbols-outlined text-orange-700 text-xl flex-shrink-0">warning</span>
          <p className="text-xs text-orange-800">{creds.nota}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-orange-900 text-white rounded-lg font-semibold hover:bg-primary transition-all shadow-md"
        >
          Registrar otro docente
        </button>
      </div>
    </div>
  </div>
);

// ── Jornada badge ─────────────────────────────────────────────

const JORNADA_STYLES: Record<JornadaDocente, string> = {
  MAÑANA:   'bg-amber-100 text-amber-800',
  TARDE:    'bg-indigo-100 text-indigo-800',
  COMPLETA: 'bg-secondary-container/40 text-on-secondary-container',
};

const JORNADA_ICONS: Record<JornadaDocente, string> = {
  MAÑANA:   'wb_sunny',
  TARDE:    'wb_twilight',
  COMPLETA: 'brightness_5',
};

const JornadaBadge = ({ jornada }: { jornada: JornadaDocente }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${JORNADA_STYLES[jornada]}`}>
    <span className="material-symbols-outlined text-[13px]">{JORNADA_ICONS[jornada]}</span>
    {jornada}
  </span>
);

// ── Docentes table ────────────────────────────────────────────

interface DocentesTableProps {
  docentes: DocenteData[];
  isLoading: boolean;
}

const DocentesTable = ({ docentes, isLoading }: DocentesTableProps) => (
  <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/60 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-fixed rounded-lg">
          <span className="material-symbols-outlined text-on-primary-fixed-variant text-xl">
            group
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-on-surface">Docentes Registrados</h3>
          <p className="text-xs text-stone-500 mt-0.5">{docentes.length} docente{docentes.length !== 1 ? 's' : ''} en el sistema</p>
        </div>
      </div>
    </div>

    {isLoading ? (
      <div className="flex items-center justify-center py-16">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">
          progress_activity
        </span>
      </div>
    ) : docentes.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-16 text-stone-400">
        <span className="material-symbols-outlined text-5xl mb-3">person_off</span>
        <p className="font-medium text-sm">No hay docentes registrados aún</p>
        <p className="text-xs mt-1">Usa el formulario de arriba para agregar el primero</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              {['Docente', 'Cédula', 'Contacto', 'Jornada', 'Grados asignados'].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-[11px] font-bold text-stone-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {docentes.map((d) => (
              <tr key={d.cedula} className="hover:bg-stone-50/70 transition-colors">
                {/* Docente */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-black text-on-primary-fixed-variant">
                        {d.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <span className="font-semibold text-on-surface">{d.nombre}</span>
                  </div>
                </td>
                {/* Cédula */}
                <td className="px-6 py-4 text-stone-500 font-mono text-xs">{d.cedula}</td>
                {/* Contacto */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {d.correo && (
                      <p className="flex items-center gap-1.5 text-xs text-stone-600">
                        <span className="material-symbols-outlined text-[13px] text-stone-400">mail</span>
                        {d.correo}
                      </p>
                    )}
                    {d.telefono && (
                      <p className="flex items-center gap-1.5 text-xs text-stone-600">
                        <span className="material-symbols-outlined text-[13px] text-stone-400">call</span>
                        {d.telefono}
                      </p>
                    )}
                    {!d.correo && !d.telefono && (
                      <span className="text-xs text-stone-300">—</span>
                    )}
                  </div>
                </td>
                {/* Jornada */}
                <td className="px-6 py-4">
                  <JornadaBadge jornada={d.jornada} />
                </td>
                {/* Grados */}
                <td className="px-6 py-4">
                  {d.grados && d.grados.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {d.grados.map((g) => (
                        <span
                          key={g.id_grado}
                          className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-xs font-medium"
                        >
                          {g.nombre}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-stone-300 italic">Sin grados asignados</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ── Empty form ────────────────────────────────────────────────

interface FormState {
  cedula: string;
  nombre: string;
  telefono: string;
  correo: string;
  jornada: JornadaDocente | '';
}

const EMPTY_FORM: FormState = {
  cedula: '',
  nombre: '',
  telefono: '',
  correo: '',
  jornada: '',
};

// ── Main Page ─────────────────────────────────────────────────

const DocenteRegistroPage = () => {
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]       = useState<Partial<FormState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [successData, setSuccessData]   = useState<{
    creds: { username: string; passwordTemporal: string; nota: string };
    nombre: string;
  } | null>(null);

  const [docentes, setDocentes]     = useState<DocenteData[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);

  // Load table on mount
  const fetchDocentes = () => {
    setLoadingTable(true);
    docentesApi.listar()
      .then(setDocentes)
      .catch(() => {/* non-critical */})
      .finally(() => setLoadingTable(false));
  };

  useEffect(() => { fetchDocentes(); }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleJornada = (v: JornadaDocente) => {
    setForm((p) => ({ ...p, jornada: v }));
    setErrors((p) => ({ ...p, jornada: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (!form.cedula.trim())  next.cedula  = 'Requerido';
    if (!form.nombre.trim())  next.nombre  = 'Requerido';
    if (!form.jornada)        next.jornada = 'Selecciona una jornada';
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      next.correo = 'Correo no válido';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    const payload: DocentePayload = {
      cedula:   form.cedula.trim(),
      nombre:   form.nombre.trim(),
      jornada:  form.jornada as JornadaDocente,
      telefono: form.telefono || undefined,
      correo:   form.correo   || undefined,
    };

    setIsSubmitting(true);
    try {
      const result = await docentesApi.crear(payload);
      setSuccessData({ creds: result.credenciales, nombre: result.docente.nombre });
      setForm(EMPTY_FORM);
      fetchDocentes();           // refresh table
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al registrar el docente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {successData && (
        <SuccessModal
          creds={successData.creds}
          nombre={successData.nombre}
          onClose={() => setSuccessData(null)}
        />
      )}

      {/* Page header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Registro de Docentes</h1>
          <p className="text-base text-stone-500 mt-1">
            Registra nuevos docentes y gestiona su información y jornada laboral
          </p>
        </div>
      </div>

      {/* Global error */}
      {submitError && (
        <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border border-error/20">
          <span className="material-symbols-outlined text-error text-xl">error</span>
          <p className="text-sm text-error font-medium">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Datos personales ────────────────────────────── */}
        <SectionCard
          title="Datos del Docente"
          icon="badge"
          iconBg="bg-primary-fixed"
          iconColor="text-on-primary-fixed-variant"
        >
          <FormField label="Cédula" id="cedula" required error={errors.cedula}>
            <input
              id="cedula"
              name="cedula"
              value={form.cedula}
              onChange={handleChange}
              placeholder="Número de cédula"
              className={inputClass}
            />
          </FormField>

          <FormField label="Nombre Completo" id="nombre" required error={errors.nombre}>
            <input
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre y apellidos"
              className={inputClass}
            />
          </FormField>

          <FormField label="Teléfono" id="telefono" error={errors.telefono}>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              value={form.telefono}
              onChange={handleChange}
              placeholder="ej. 3001234567"
              className={inputClass}
            />
          </FormField>

          <FormField label="Correo Electrónico" id="correo" error={errors.correo}>
            <input
              id="correo"
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className={inputClass}
            />
          </FormField>
        </SectionCard>

        {/* ── Jornada ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-3 border-b border-stone-100">
            <div className="p-2 bg-tertiary-fixed rounded-lg">
              <span className="material-symbols-outlined text-xl text-tertiary">schedule</span>
            </div>
            <h3 className="font-semibold text-on-surface">
              Jornada Laboral
              <span className="text-error ml-1 font-normal">*</span>
            </h3>
          </div>
          <div className="p-6">
            <p className="text-xs text-on-surface-variant mb-4">
              Selecciona el turno en el que trabajará el docente. La jornada
              <strong> Completa</strong> indica que cubre ambos turnos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {JORNADA_OPTIONS.map((opt) => (
                <JornadaOption
                  key={opt.value}
                  {...opt}
                  selected={form.jornada === opt.value}
                  onSelect={handleJornada}
                />
              ))}
            </div>
            {errors.jornada && (
              <p className="text-xs text-error font-medium flex items-center gap-1 mt-3">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.jornada}
              </p>
            )}

            {/* Credentials info */}
            <div className="mt-5 flex gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <span className="material-symbols-outlined text-orange-700 text-xl flex-shrink-0">key</span>
              <div>
                <p className="text-xs font-semibold text-orange-900">Acceso automático</p>
                <p className="text-xs text-orange-700 mt-0.5">
                  Se creará un usuario con la <strong>cédula</strong> como usuario y contraseña temporal.
                  El docente deberá cambiarla en su primer inicio de sesión.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────── */}
        <div className="flex gap-4 justify-end pb-2">
          <button
            type="button"
            onClick={() => { setForm(EMPTY_FORM); setErrors({}); setSubmitError(''); }}
            className="px-6 py-3 bg-white border border-outline-variant text-on-surface-variant
              rounded-lg font-semibold hover:bg-stone-50 transition-all"
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-orange-900 text-white rounded-lg font-semibold
              hover:bg-primary transition-all shadow-md hover:shadow-lg
              disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">person_add</span>
                Registrar Docente
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Docentes table ───────────────────────────────── */}
      <DocentesTable docentes={docentes} isLoading={loadingTable} />
    </>
  );
};

export default DocenteRegistroPage;