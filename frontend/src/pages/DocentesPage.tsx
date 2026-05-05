// src/pages/DocentesPage.tsx
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import {
  docentesApi,
  type DocentePayload,
  type DocenteListItem,
  type GradoDisponibilidad,
  type JornadaDocente,
} from '../services/api';
import FormField, { inputClass } from '../components/ui/FormField';

// ── Constants ─────────────────────────────────────────────────

const NOMBRES_GRADOS = [
  'Pre Jardín', 'Jardín', 'Transición',
  'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto',
] as const;

type NombreGrado = typeof NOMBRES_GRADOS[number];

const JORNADA_LABEL: Record<JornadaDocente, string> = {
  MAÑANA:   'Mañana',
  TARDE:    'Tarde',
  COMPLETA: 'Completa',
};

const JORNADA_COLOR: Record<JornadaDocente, string> = {
  MAÑANA:   'bg-amber-100 text-amber-800',
  TARDE:    'bg-indigo-100 text-indigo-800',
  COMPLETA: 'bg-emerald-100 text-emerald-800',
};

// ── Empty form ────────────────────────────────────────────────

interface FormState {
  cedula: string;
  nombre: string;
  telefono: string;
  correo: string;
  jornada: JornadaDocente | '';
  nombreGrado: NombreGrado | '';
}

const EMPTY_FORM: FormState = {
  cedula: '', nombre: '', telefono: '', correo: '', jornada: '', nombreGrado: '',
};

// ── Sub-components ────────────────────────────────────────────

/** Badge de jornada */
const JornadaBadge = ({ jornada }: { jornada: JornadaDocente }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${JORNADA_COLOR[jornada]}`}>
    {JORNADA_LABEL[jornada]}
  </span>
);

/** Botón selector de jornada */
interface JornadaBtnProps {
  value: JornadaDocente;
  icon: string;
  desc: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (v: JornadaDocente) => void;
}
const JornadaBtn = ({ value, icon, desc, selected, disabled, onSelect }: JornadaBtnProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => !disabled && onSelect(value)}
    className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all
      ${disabled  ? 'opacity-35 cursor-not-allowed border-stone-200 bg-stone-50'
      : selected  ? 'border-primary bg-primary-fixed/20 shadow-sm'
      :             'border-outline-variant bg-white hover:border-primary/40 hover:bg-stone-50'}`}
  >
    <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors
      ${disabled ? 'bg-stone-200 text-stone-400'
      : selected ? 'bg-primary text-white'
      :            'bg-stone-100 text-stone-500'}`}>
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </div>
    <div className="text-center">
      <p className={`font-semibold text-sm ${selected && !disabled ? 'text-primary' : 'text-on-surface'}`}>
        {JORNADA_LABEL[value]}
      </p>
      <p className="text-[11px] text-on-surface-variant">{desc}</p>
    </div>
    {selected && !disabled && (
      <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
    )}
  </button>
);

/** Grid de disponibilidad de grados */
interface DisponibilidadGridProps {
  grados: GradoDisponibilidad[];
  gradoSeleccionado: NombreGrado | '';
  jornadaSeleccionada: JornadaDocente | '';
  onSelect: (nombre: NombreGrado) => void;
}
const DisponibilidadGrid = ({
  grados, gradoSeleccionado, jornadaSeleccionada, onSelect,
}: DisponibilidadGridProps) => {
  // Agrupa por nombre de grado
  const porNombre = NOMBRES_GRADOS.map((nombre) => {
    const manana = grados.find((g) => g.nombre === nombre && g.jornada === 'MAÑANA');
    const tarde  = grados.find((g) => g.nombre === nombre && g.jornada === 'TARDE');
    return { nombre, manana, tarde };
  });

  /** Indica si un grado está disponible para la jornada seleccionada */
  const estaDisponible = (nombre: NombreGrado): boolean => {
    if (!jornadaSeleccionada) return true;
    const item = porNombre.find((g) => g.nombre === nombre)!;
    if (jornadaSeleccionada === 'COMPLETA') {
      return !item.manana?.docente && !item.tarde?.docente;
    }
    const fila = jornadaSeleccionada === 'MAÑANA' ? item.manana : item.tarde;
    const filaOpuesta = jornadaSeleccionada === 'MAÑANA' ? item.tarde : item.manana;
    // Bloqueado si ya hay docente en esa jornada o si el opuesto tiene uno COMPLETA
    if (fila?.docente) return false;
    if (filaOpuesta?.docente?.jornada === 'COMPLETA') return false;
    return true;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-200">
            <th className="px-4 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Grado</th>
            <th className="px-4 py-3 text-center text-xs font-bold text-amber-600 uppercase tracking-wider w-44">
              <span className="material-symbols-outlined text-base align-middle mr-1">wb_sunny</span>Mañana
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider w-44">
              <span className="material-symbols-outlined text-base align-middle mr-1">wb_twilight</span>Tarde
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-stone-400 uppercase tracking-wider w-24">Seleccionar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {porNombre.map(({ nombre, manana, tarde }) => {
            const disponible = estaDisponible(nombre);
            const selected   = gradoSeleccionado === nombre;

            const CeldaDocente = ({ g }: { g: GradoDisponibilidad | undefined }) =>
              g?.docente ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-on-surface truncate max-w-[130px]">{g.docente.nombre}</span>
                  <JornadaBadge jornada={g.docente.jornada} />
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-secondary font-medium">
                  <span className="material-symbols-outlined text-base">check_circle</span>Libre
                </span>
              );

            return (
              <tr
                key={nombre}
                className={`transition-colors ${selected ? 'bg-primary-fixed/10' : disponible ? 'hover:bg-stone-50' : 'opacity-50'}`}
              >
                <td className="px-4 py-3 font-semibold text-on-surface">{nombre}</td>
                <td className="px-4 py-3 text-center"><CeldaDocente g={manana} /></td>
                <td className="px-4 py-3 text-center"><CeldaDocente g={tarde} /></td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    disabled={!disponible}
                    onClick={() => disponible && onSelect(nombre)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                      ${selected    ? 'bg-primary text-white shadow'
                      : disponible ? 'bg-white border border-primary text-primary hover:bg-primary-fixed/20'
                      :              'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
                  >
                    {selected ? '✓ Elegido' : disponible ? 'Elegir' : 'Ocupado'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** Card de docente registrado */
const DocenteCard = ({ docente }: { docente: DocenteListItem }) => (
  <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-on-primary-fixed-variant text-2xl">person</span>
        </div>
        <div>
          <p className="font-bold text-on-surface text-sm">{docente.nombre}</p>
          <p className="text-xs text-stone-500">CC {docente.cedula}</p>
        </div>
      </div>
      <JornadaBadge jornada={docente.jornada} />
    </div>

    {docente.grados.length > 0 && (
      <div className="flex flex-wrap gap-2 pt-1 border-t border-stone-100">
        {docente.grados.map((g) => (
          <span key={g.id_grado} className="flex items-center gap-1 text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full font-medium">
            <span className="material-symbols-outlined text-[14px] text-secondary">school</span>
            {g.nombre} – {g.jornada === 'MAÑANA' ? 'M' : 'T'}
          </span>
        ))}
      </div>
    )}

    <div className="text-xs text-stone-400 flex gap-4 pt-1 border-t border-stone-100">
      {docente.telefono && <span>📞 {docente.telefono}</span>}
      {docente.correo   && <span className="truncate">✉ {docente.correo}</span>}
    </div>
  </div>
);

/** Modal de éxito */
interface SuccessModalProps {
  data: DocenteListItem & { credenciales: { username: string; passwordTemporal: string; nota: string }; gradosAsignados: { nombre: string; jornada: string }[] };
  onClose: () => void;
}
const SuccessModal = ({ data, onClose }: SuccessModalProps) => (
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
        {/* Grados asignados */}
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Grados asignados</p>
          <div className="flex flex-wrap gap-2">
            {data.gradosAsignados.map((g) => (
              <span key={`${g.nombre}-${g.jornada}`} className="text-xs bg-secondary-container/20 text-secondary px-3 py-1 rounded-full font-medium">
                {g.nombre} – Jornada {g.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}
              </span>
            ))}
          </div>
        </div>
        {/* Credenciales */}
        <div className="bg-stone-50 rounded-xl border border-stone-200 p-4">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Credenciales de acceso</p>
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

// ── Main Page ─────────────────────────────────────────────────

const DocentesPage = () => {
  const [form, setForm]                   = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]               = useState<Partial<Record<keyof FormState, string>>>({});
  const [grados, setGrados]               = useState<GradoDisponibilidad[]>([]);
  const [docentes, setDocentes]           = useState<DocenteListItem[]>([]);
  const [loadingGrados, setLoadingGrados] = useState(true);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState('');
  const [successData, setSuccessData]     = useState<Parameters<typeof SuccessModal>[0]['data'] | null>(null);

  const cargarDatos = () => {
    setLoadingGrados(true);
    Promise.all([docentesApi.disponibilidad(), docentesApi.listar()])
      .then(([disp, docs]) => { setGrados(disp); setDocentes(docs); })
      .catch(() => {})
      .finally(() => setLoadingGrados(false));
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleJornada = (v: JornadaDocente) => {
    setForm((p) => ({ ...p, jornada: v, nombreGrado: '' })); // reset grado al cambiar jornada
    setErrors((p) => ({ ...p, jornada: undefined, nombreGrado: undefined }));
  };

  const handleGrado = (nombre: NombreGrado) => {
    setForm((p) => ({ ...p, nombreGrado: nombre }));
    setErrors((p) => ({ ...p, nombreGrado: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.cedula.trim())     next.cedula      = 'Requerido';
    if (!form.nombre.trim())     next.nombre      = 'Requerido';
    if (!form.jornada)           next.jornada     = 'Selecciona una jornada';
    if (!form.nombreGrado)       next.nombreGrado = 'Selecciona el grado a dirigir';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    const payload: DocentePayload = {
      cedula:      form.cedula.trim(),
      nombre:      form.nombre.trim(),
      telefono:    form.telefono || undefined,
      correo:      form.correo   || undefined,
      jornada:     form.jornada  as JornadaDocente,
      nombreGrado: form.nombreGrado,
    };

    setIsSubmitting(true);
    try {
      const result = await docentesApi.crear(payload);
      setSuccessData({
        cedula:    form.cedula,
        nombre:    form.nombre,
        telefono:  form.telefono || null,
        correo:    form.correo   || null,
        jornada:   form.jornada  as JornadaDocente,
        grados:    result.gradosAsignados,
        gradosAsignados: result.gradosAsignados,
        credenciales:    result.credenciales,
      });
      setForm(EMPTY_FORM);
      cargarDatos();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al registrar el docente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {successData && (
        <SuccessModal data={successData} onClose={() => setSuccessData(null)} />
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-primary">Gestión de Docentes</h1>
        <p className="text-base text-stone-500 mt-1">
          Registra docentes, asigna jornada y grado a cargo. Cada grado admite un director por jornada.
        </p>
      </div>

      <div className="space-y-8">

        {/* ── Formulario ───────────────────────────────────── */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-4 border-b border-stone-100 bg-primary-fixed/10 flex items-center gap-3">
              <div className="p-2 bg-primary-fixed rounded-lg">
                <span className="material-symbols-outlined text-on-primary-fixed-variant text-xl">person_add</span>
              </div>
              <h2 className="font-semibold text-on-surface">Registrar nuevo docente</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {submitError && (
                <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border border-error/20">
                  <span className="material-symbols-outlined text-error text-xl">error</span>
                  <p className="text-sm text-error font-medium">{submitError}</p>
                </div>
              )}

              {/* Datos personales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Cédula" id="cedula" required error={errors.cedula}>
                  <input id="cedula" name="cedula" value={form.cedula} onChange={handleChange}
                    placeholder="Número de cédula" className={inputClass} />
                </FormField>
                <FormField label="Nombre completo" id="nombre" required error={errors.nombre}>
                  <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange}
                    placeholder="Nombre y apellidos" className={inputClass} />
                </FormField>
                <FormField label="Teléfono" id="telefono">
                  <input id="telefono" name="telefono" type="tel" value={form.telefono} onChange={handleChange}
                    placeholder="ej. 3001234567" className={inputClass} />
                </FormField>
                <FormField label="Correo electrónico" id="correo">
                  <input id="correo" name="correo" type="email" value={form.correo} onChange={handleChange}
                    placeholder="correo@escuela.edu.co" className={inputClass} />
                </FormField>
              </div>

              {/* Jornada */}
              <div>
                <p className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase mb-3">
                  Jornada laboral <span className="text-error ml-1">*</span>
                </p>
                <div className="flex gap-3">
                  <JornadaBtn value="MAÑANA"   icon="wb_sunny"    desc="6:00 a.m. – 12:00 m."
                    selected={form.jornada === 'MAÑANA'}   disabled={false} onSelect={handleJornada} />
                  <JornadaBtn value="TARDE"    icon="wb_twilight" desc="12:00 m. – 6:00 p.m."
                    selected={form.jornada === 'TARDE'}    disabled={false} onSelect={handleJornada} />
                  <JornadaBtn value="COMPLETA" icon="brightness_5" desc="6:00 a.m. – 6:00 p.m."
                    selected={form.jornada === 'COMPLETA'} disabled={false} onSelect={handleJornada} />
                </div>
                {errors.jornada && (
                  <p className="text-xs text-error flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-[14px]">error</span>{errors.jornada}
                  </p>
                )}
              </div>

              {/* Grado — tabla de disponibilidad */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Grado a dirigir <span className="text-error ml-1">*</span>
                  </p>
                  {!form.jornada && (
                    <span className="text-xs text-stone-400 italic">Selecciona la jornada primero</span>
                  )}
                </div>

                {loadingGrados ? (
                  <div className="flex items-center justify-center h-24 rounded-xl border border-outline-variant bg-stone-50">
                    <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                  </div>
                ) : (
                  <DisponibilidadGrid
                    grados={grados}
                    gradoSeleccionado={form.nombreGrado}
                    jornadaSeleccionada={form.jornada}
                    onSelect={handleGrado}
                  />
                )}

                {errors.nombreGrado && (
                  <p className="text-xs text-error flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-[14px]">error</span>{errors.nombreGrado}
                  </p>
                )}
              </div>

              {/* Resumen selección */}
              {form.jornada && form.nombreGrado && (
                <div className="flex gap-3 p-4 bg-secondary-container/20 rounded-xl border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0">info</span>
                  <p className="text-sm text-on-surface-variant">
                    <strong className="text-on-surface">{form.nombre || 'El docente'}</strong> será director del grado{' '}
                    <strong className="text-secondary">{form.nombreGrado}</strong> en jornada{' '}
                    <strong className="text-secondary">{JORNADA_LABEL[form.jornada as JornadaDocente]}</strong>.
                    {form.jornada === 'COMPLETA' && ' Se asignará a las dos filas del grado (mañana y tarde).'}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button"
                  onClick={() => { setForm(EMPTY_FORM); setErrors({}); setSubmitError(''); }}
                  className="px-5 py-2.5 border border-outline-variant bg-white text-on-surface-variant rounded-lg font-semibold hover:bg-stone-50 transition-all text-sm">
                  Limpiar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-orange-900 text-white rounded-lg font-semibold hover:bg-primary transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                  {isSubmitting ? (
                    <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Guardando...</>
                  ) : (
                    <><span className="material-symbols-outlined text-lg">person_add</span>Registrar Docente</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Docentes registrados ─────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-on-surface">
              Docentes registrados
              <span className="ml-2 px-2 py-0.5 bg-secondary-container/30 text-secondary text-sm rounded-full font-bold">
                {docentes.length}
              </span>
            </h2>
            <button onClick={cargarDatos}
              className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-lg transition-colors">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>

          {docentes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-12 flex flex-col items-center gap-3 text-stone-400">
              <span className="material-symbols-outlined text-5xl">person_off</span>
              <p className="text-sm font-medium">No hay docentes registrados aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {docentes.map((d) => <DocenteCard key={d.cedula} docente={d} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DocentesPage;