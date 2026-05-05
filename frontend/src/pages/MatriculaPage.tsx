// src/pages/MatriculaPage.tsx
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { gradosApi, matriculasApi, type Grado, type MatriculaPayload } from '../services/api';
import FormField, { inputClass, selectClass } from '../components/ui/FormField';
import SectionCard from '../components/ui/SectionCard';

// ── Types ─────────────────────────────────────────────────────

type Jornada = 'MAÑANA' | 'TARDE';

interface FormState {
  // Estudiante
  numero_identidad: string;
  nombre_estudiante: string;
  fecha_nacimiento: string;
  rh: string;
  direccion_estudiante: string;
  observaciones: string;
  // Matricula
  id_grado: string;
  year: string;
  jornada: Jornada | '';
  // Acudiente
  cedula_acudiente: string;
  nombre_acudiente: string;
  telefono_acudiente: string;
  correo_acudiente: string;
  direccion_acudiente: string;
  parentesco: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  numero_identidad: '',
  nombre_estudiante: '',
  fecha_nacimiento: '',
  rh: '',
  direccion_estudiante: '',
  observaciones: '',
  id_grado: '',
  year: String(new Date().getFullYear()),
  jornada: '',
  cedula_acudiente: '',
  nombre_acudiente: '',
  telefono_acudiente: '',
  correo_acudiente: '',
  direccion_acudiente: '',
  parentesco: '',
};

// ── Jornada Option Card ───────────────────────────────────────

interface JornadaOptionProps {
  value: Jornada;
  label: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelect: (v: Jornada) => void;
}

const JornadaOption = ({
  value,
  label,
  description,
  icon,
  selected,
  onSelect,
}: JornadaOptionProps) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={`flex-1 flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all
      ${
        selected
          ? 'border-primary bg-primary-fixed/20 shadow-sm'
          : 'border-outline-variant bg-white hover:border-primary/40 hover:bg-stone-50'
      }`}
  >
    <div
      className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
        ${selected ? 'bg-primary text-white' : 'bg-stone-100 text-stone-500'}`}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </div>
    <div>
      <p className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-on-surface'}`}>
        {label}
      </p>
      <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
    </div>
    {selected && (
      <span className="material-symbols-outlined text-primary ml-auto text-xl">
        check_circle
      </span>
    )}
  </button>
);

// ── Success Modal ─────────────────────────────────────────────

interface SuccessModalProps {
  credenciales: { username: string; passwordTemporal: string; nota: string };
  onClose: () => void;
}

const SuccessModal = ({ credenciales, onClose }: SuccessModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
      {/* Header */}
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
        {/* Credentials box */}
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

        {/* Note */}
        <div className="flex gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
          <span className="material-symbols-outlined text-orange-700 text-xl flex-shrink-0">
            warning
          </span>
          <p className="text-xs text-orange-800">{credenciales.nota}</p>
        </div>

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

// ── Main Page ─────────────────────────────────────────────────

const MatriculaPage = () => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [grados, setGrados] = useState<Grado[]>([]);
  const [isLoadingGrados, setIsLoadingGrados] = useState(true);
  const [gradosLoadError, setGradosLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successCredenciales, setSuccessCredenciales] = useState<{
    username: string; passwordTemporal: string; nota: string;
  } | null>(null);

  // Load grades on mount
  useEffect(() => {
    setIsLoadingGrados(true);
    setGradosLoadError('');

    gradosApi.listar()
      .then(setGrados)
      .catch((error) => {
        console.error('Error cargando grados:', error);
        setGradosLoadError('No se pudieron cargar los grados. Verifica tu sesión o la conexión con la API.');
      })
      .finally(() => setIsLoadingGrados(false));
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // ── FIX: reset id_grado when jornada changes ──────────────
  const handleJornadaSelect = (value: Jornada) => {
    setForm((prev) => ({ ...prev, jornada: value, id_grado: '' }));
    setErrors((prev) => ({ ...prev, jornada: undefined, id_grado: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.numero_identidad.trim()) next.numero_identidad = 'Requerido';
    if (!form.nombre_estudiante.trim()) next.nombre_estudiante = 'Requerido';
    if (!form.fecha_nacimiento) next.fecha_nacimiento = 'Requerido';
    if (!form.id_grado) next.id_grado = 'Selecciona un grado';
    if (!form.year || isNaN(Number(form.year))) next.year = 'Año inválido';
    if (!form.jornada) next.jornada = 'Selecciona una jornada';
    if (!form.cedula_acudiente.trim()) next.cedula_acudiente = 'Requerido';
    if (!form.nombre_acudiente.trim()) next.nombre_acudiente = 'Requerido';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    const payload: MatriculaPayload = {
      estudiante: {
        numero_identidad: form.numero_identidad.trim(),
        nombre: form.nombre_estudiante.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        rh: form.rh || undefined,
        direccion: form.direccion_estudiante || undefined,
        observaciones: form.observaciones || undefined,
      },
      matricula: {
        id_grado: Number(form.id_grado),
        year: Number(form.year),
        jornada: form.jornada as Jornada,
      },
      acudiente: {
        cedula: form.cedula_acudiente.trim(),
        nombre: form.nombre_acudiente.trim(),
        telefono: form.telefono_acudiente || undefined,
        correo: form.correo_acudiente || undefined,
        direccion: form.direccion_acudiente || undefined,
      },
      relacion: { parentesco: form.parentesco || undefined },
    };

    setIsSubmitting(true);
    try {
      const result = await matriculasApi.crear(payload);
      setSuccessCredenciales(result.credenciales);
      setForm(EMPTY_FORM);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al crear la matrícula');
    } finally {
      setIsSubmitting(false);
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1);

  return (
    <>
      {successCredenciales && (
        <SuccessModal
          credenciales={successCredenciales}
          onClose={() => setSuccessCredenciales(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Nueva Matrícula</h1>
          <p className="text-base text-stone-500 mt-1">
            Registra al estudiante, asigna el grado y configura el acceso del acudiente
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
        {/* ── Sección 1: Estudiante ─────────────────────────── */}
        <SectionCard
          title="Datos del Estudiante"
          icon="person"
          iconBg="bg-primary-fixed"
          iconColor="text-on-primary-fixed-variant"
        >
          <FormField label="Número de Identidad" id="numero_identidad" required error={errors.numero_identidad}>
            <input
              id="numero_identidad"
              name="numero_identidad"
              value={form.numero_identidad}
              onChange={handleChange}
              placeholder="ej. 1007123456"
              className={inputClass}
            />
          </FormField>

          <FormField label="Nombre Completo" id="nombre_estudiante" required error={errors.nombre_estudiante}>
            <input
              id="nombre_estudiante"
              name="nombre_estudiante"
              value={form.nombre_estudiante}
              onChange={handleChange}
              placeholder="Nombre y apellidos"
              className={inputClass}
            />
          </FormField>

          <FormField label="Fecha de Nacimiento" id="fecha_nacimiento" required error={errors.fecha_nacimiento}>
            <input
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>

          <FormField label="Tipo de Sangre (RH)" id="rh">
            <select id="rh" name="rh" value={form.rh} onChange={handleChange} className={selectClass}>
              <option value="">Seleccionar</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Dirección" id="direccion_estudiante">
              <input
                id="direccion_estudiante"
                name="direccion_estudiante"
                value={form.direccion_estudiante}
                onChange={handleChange}
                placeholder="Dirección de residencia"
                className={inputClass}
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="Observaciones" id="observaciones">
              <textarea
                id="observaciones"
                name="observaciones"
                value={form.observaciones}
                onChange={handleChange}
                rows={2}
                placeholder="Condiciones médicas, necesidades especiales, etc."
                className={inputClass + ' resize-none'}
              />
            </FormField>
          </div>
        </SectionCard>

        {/* ── Sección 2: Matrícula ──────────────────────────── */}
        <SectionCard
          title="Datos de Matrícula"
          icon="school"
          iconBg="bg-tertiary-fixed"
          iconColor="text-tertiary"
        >
          {/* ── FIX: jornada va PRIMERO para poder filtrar grados ── */}
          <div className="md:col-span-2">
            <p className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase mb-3">
              Jornada del Estudiante
              <span className="text-error ml-1">*</span>
            </p>
            <div className="flex gap-3">
              <JornadaOption
                value="MAÑANA"
                label="Jornada Mañana"
                description="Horario: Preescolar 7:00 a.m. – 11:30 m.
                Primaria 6:30 a.m. – 11:45 a.m."
                icon="wb_sunny"
                selected={form.jornada === 'MAÑANA'}
                onSelect={handleJornadaSelect}
              />
              <JornadaOption
                value="TARDE"
                label="Jornada Tarde"
                description="Horario: Preescolar 1:00 p.m. – 5:30 p.m.
                Primaria 12:40 p.m. – 5:40 p.m."
                icon="wb_twilight"
                selected={form.jornada === 'TARDE'}
                onSelect={handleJornadaSelect}
              />
            </div>
            {errors.jornada && (
              <p className="text-xs text-error font-medium flex items-center gap-1 mt-2">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.jornada}
              </p>
            )}
          </div>

          {/* ── FIX: grados filtrados por jornada seleccionada ── */}
          <FormField label="Grado" id="id_grado" required error={errors.id_grado || gradosLoadError}>
            <select
              id="id_grado"
              name="id_grado"
              value={form.id_grado}
              onChange={handleChange}
              className={selectClass}
              disabled={!form.jornada || isLoadingGrados}
            >
              <option value="" disabled>
                {isLoadingGrados
                  ? 'Cargando grados...'
                  : form.jornada
                    ? 'Selecciona un grado'
                    : 'Primero selecciona la jornada'}
              </option>
              {grados
                .filter((g) => !form.jornada || g.jornada === form.jornada)
                .map((g) => (
                  <option key={g.id_grado} value={g.id_grado}>
                    {g.nombre}
                  </option>
                ))}
              {!isLoadingGrados && form.jornada && grados.filter((g) => g.jornada === form.jornada).length === 0 && (
                <option value="" disabled>No hay grados disponibles para esta jornada</option>
              )}
            </select>
          </FormField>

          <FormField label="Año Lectivo" id="year" required error={errors.year}>
            <select
              id="year"
              name="year"
              value={form.year}
              onChange={handleChange}
              className={selectClass}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </FormField>
        </SectionCard>

        {/* ── Sección 3: Acudiente ──────────────────────────── */}
        <SectionCard
          title="Datos del Acudiente"
          icon="family_restroom"
          iconBg="bg-secondary-fixed"
          iconColor="text-on-secondary-container"
        >
          {/* Credential notice */}
          <div className="md:col-span-2">
            <div className="flex gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <span className="material-symbols-outlined text-orange-700 text-xl flex-shrink-0">
                key
              </span>
              <div>
                <p className="text-xs font-semibold text-orange-900">Credenciales automáticas</p>
                <p className="text-xs text-orange-700 mt-0.5">
                  Se creará automáticamente un acceso para el acudiente. El usuario y contraseña
                  temporal serán el <strong>número de identidad del estudiante</strong>.
                </p>
              </div>
            </div>
          </div>

          <FormField label="Cédula del Acudiente" id="cedula_acudiente" required error={errors.cedula_acudiente}>
            <input
              id="cedula_acudiente"
              name="cedula_acudiente"
              value={form.cedula_acudiente}
              onChange={handleChange}
              placeholder="Número de cédula"
              className={inputClass}
            />
          </FormField>

          <FormField label="Nombre Completo" id="nombre_acudiente" required error={errors.nombre_acudiente}>
            <input
              id="nombre_acudiente"
              name="nombre_acudiente"
              value={form.nombre_acudiente}
              onChange={handleChange}
              placeholder="Nombre y apellidos del acudiente"
              className={inputClass}
            />
          </FormField>

          <FormField label="Teléfono" id="telefono_acudiente">
            <input
              id="telefono_acudiente"
              name="telefono_acudiente"
              type="tel"
              value={form.telefono_acudiente}
              onChange={handleChange}
              placeholder="ej. 3001234567"
              className={inputClass}
            />
          </FormField>

          <FormField label="Correo Electrónico" id="correo_acudiente">
            <input
              id="correo_acudiente"
              name="correo_acudiente"
              type="email"
              value={form.correo_acudiente}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className={inputClass}
            />
          </FormField>

          <FormField label="Dirección" id="direccion_acudiente">
            <input
              id="direccion_acudiente"
              name="direccion_acudiente"
              value={form.direccion_acudiente}
              onChange={handleChange}
              placeholder="Dirección del acudiente"
              className={inputClass}
            />
          </FormField>

          <FormField label="Parentesco" id="parentesco">
            <select
              id="parentesco"
              name="parentesco"
              value={form.parentesco}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">Seleccionar</option>
              {['Padre', 'Madre', 'Abuelo/a', 'Tío/a', 'Hermano/a', 'Tutor legal', 'Otro'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </FormField>
        </SectionCard>

        {/* ── Submit ────────────────────────────────────────── */}
        <div className="flex gap-4 justify-end pb-6">
          <button
            type="button"
            onClick={() => { setForm(EMPTY_FORM); setErrors({}); setSubmitError(''); }}
            className="px-6 py-3 bg-white border border-outline-variant text-on-surface-variant rounded-lg
              font-semibold hover:bg-stone-50 transition-all"
          >
            Limpiar formulario
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-orange-900 text-white rounded-lg font-semibold
              hover:bg-primary transition-all shadow-md hover:shadow-lg
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">how_to_reg</span>
                Crear Matrícula
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default MatriculaPage;