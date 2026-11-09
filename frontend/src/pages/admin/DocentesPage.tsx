// src/pages/admin/DocentesPage.tsx
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { useRestablecerClave } from '../../hooks/useRestablecerClave';
import RestablecerClaveDialogos from '../../components/ui/RestablecerClaveDialogos';
import {
  docentesApi,
  type DocentePayload,
  type DocenteListItem,
  type GradoDisponibilidad,
  type JornadaDocente,
} from '../../services/api';
import { useEditarDocente }   from '../../hooks/useEditarDocente';
import EditarDocenteModal     from '../../components/docente/EditarDocenteModal';
import FormField, { inputClass } from '../../components/ui/FormField';
import JornadaBtn             from '../../components/docente/JornadaBtn';
import DisponibilidadGrid     from '../../components/docente/DisponibilidadGrid';
import DocenteCard            from '../../components/docente/DocenteCard';
import SuccessModal           from '../../components/docente/DocenteSuccessModal';
import { JORNADA_LABEL, type NombreGrado } from '../../constants/docentes';

// ── Empty form ────────────────────────────────────────────────

interface FormState {
  cedula: string; nombre: string; telefono: string;
  correo: string; jornada: JornadaDocente | ''; nombreGrado: NombreGrado | '';
}

const EMPTY_FORM: FormState = {
  cedula: '', nombre: '', telefono: '', correo: '', jornada: '', nombreGrado: '',
};

const SIN_GRADOS:   GradoDisponibilidad[] = [];
const SIN_DOCENTES: DocenteListItem[]     = [];

// ── Main Page ─────────────────────────────────────────────────

const DocentesPage = () => {
  const [form, setForm]                   = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]               = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState('');
  const [successData, setSuccessData]     = useState<Parameters<typeof SuccessModal>[0]['data'] | null>(null);

  // Hook de edición
  const {
    editando,
    isLoading: editLoading,
    error:     editError,
    abrirEdicion,
    cerrarEdicion,
    confirmarEdicion,
  } = useEditarDocente();

  const clave = useRestablecerClave();

  const queryClient = useQueryClient();
  const disponibilidadQuery = useQuery({
    queryKey: queryKeys.docentes.disponibilidad,
    queryFn:  docentesApi.disponibilidad,
  });
  const docentesQuery = useQuery({
    queryKey: queryKeys.docentes.lista,
    queryFn:  docentesApi.listar,
  });
  const grados        = disponibilidadQuery.data ?? SIN_GRADOS;
  const docentes      = docentesQuery.data ?? SIN_DOCENTES;
  const loadingGrados = disponibilidadQuery.isPending || docentesQuery.isPending;

  /** Recarga lista de docentes y disponibilidad de grados. */
  const cargarDatos = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.docentes.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }); // total de docentes
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleJornada = (v: JornadaDocente) => {
    setForm((p) => ({ ...p, jornada: v, nombreGrado: '' }));
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
        cedula:          form.cedula,
        nombre:          form.nombre,
        telefono:        form.telefono || null,
        correo:          form.correo   || null,
        jornada:         form.jornada  as JornadaDocente,
        grados:          result.gradosAsignados,
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

  // Actualiza en memoria tras editar exitosamente
  const handleEditSuccess = (actualizado: DocenteListItem) => {
    queryClient.setQueryData<DocenteListItem[]>(queryKeys.docentes.lista, (prev = []) =>
      prev.map((d) => d.cedula === actualizado.cedula ? actualizado : d),
    );
  };

  return (
    <>
      {/* Modales */}
      {successData && (
        <SuccessModal data={successData} onClose={() => setSuccessData(null)} />
      )}
      <RestablecerClaveDialogos clave={clave} />
      {editando && (
        <EditarDocenteModal
          key={editando.cedula}
          docente={editando}
          isLoading={editLoading}
          error={editError}
          onClose={cerrarEdicion}
          onConfirm={(payload) => confirmarEdicion(payload, handleEditSuccess)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-primary">Gestión de Docentes</h1>
        <p className="text-base text-stone-500 mt-1">
          Registra docentes, asigna jornada y grado a cargo. Pasa el cursor sobre una tarjeta para editar.
        </p>
      </div>

      <div className="space-y-8">

        {/* ── Formulario de registro ───────────────────────── */}
        <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
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
                <JornadaBtn value="MAÑANA"   icon="wb_sunny"     desc="6:00 a.m. – 12:00 m."
                  selected={form.jornada === 'MAÑANA'}   disabled={false} onSelect={handleJornada} />
                <JornadaBtn value="TARDE"    icon="wb_twilight"  desc="12:00 m. – 6:00 p.m."
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

            {/* Grado */}
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

            <div className="flex gap-3 pt-1">
              <button type="button"
                onClick={() => { setForm(EMPTY_FORM); setErrors({}); setSubmitError(''); }}
                className="px-5 py-2.5 border border-outline-variant bg-white text-on-surface-variant
                  rounded-lg font-semibold hover:bg-stone-50 transition-all text-sm">
                Limpiar
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 py-2.5 bg-orange-900 text-white rounded-lg font-semibold hover:bg-primary
                  transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 text-sm">
                {isSubmitting ? (
                  <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Guardando...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">person_add</span>Registrar Docente</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Lista de docentes ────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-on-surface">
              Docentes registrados
              <span className="ml-2 px-2 py-0.5 bg-secondary-container/30 text-secondary
                text-sm rounded-full font-bold">
                {docentes.length}
              </span>
            </h2>
            <button onClick={cargarDatos}
              className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50
                rounded-lg transition-colors">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>

          {docentes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-outline-variant shadow-sm
              p-12 flex flex-col items-center gap-3 text-stone-400">
              <span className="material-symbols-outlined text-5xl">person_off</span>
              <p className="text-sm font-medium">No hay docentes registrados aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {docentes.map((d) => (
                <DocenteCard key={d.cedula} docente={d} onEditar={abrirEdicion}
                  onRestablecerClave={(doc) => clave.pedir({ tipo: 'docente', cedula: doc.cedula, nombre: doc.nombre })} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DocentesPage;