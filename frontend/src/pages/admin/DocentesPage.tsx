// src/pages/admin/DocentesPage.tsx
// Registrar docentes (con jornada y grado a dirigir) y ver los registrados.
// El estado, la validación y las llamadas a la API no cambian; solo el diseño.
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
import PageHeader from '../../components/ds/PageHeader';
import StatCard   from '../../components/ds/StatCard';
import Tarjeta    from '../../components/ds/Tarjeta';
import { Campo } from '../../components/ds/Campo';
import { claseInput, claseInputError } from '../../components/ds/campo-estilos';
import { Boton, Icono } from '../../components/ds/Controles';
import { Aviso, Cargando, Mensaje } from '../../components/ds/Estados';
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

  // Resumen
  const enManana   = docentes.filter((d) => d.jornada === 'MAÑANA').length;
  const tardeOComp = docentes.length - enManana;
  const libres     = grados.filter((g) => !g.docente).length;
  const err = (campo: keyof FormState) => (errors[campo] ? claseInputError : claseInput);
  const limpiar = () => { setForm(EMPTY_FORM); setErrors({}); setSubmitError(''); };

  return (
    <>
      {successData && <SuccessModal data={successData} onClose={() => setSuccessData(null)} />}
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

      <PageHeader titulo="Docentes" subtitulo="Registra docentes y asigna su jornada y el grado que dirigen"
        acciones={<Boton icono="refresh" onClick={cargarDatos} className="min-h-[52px] rounded-full w-full lg:w-auto">Actualizar</Boton>} />

      <section aria-label="Resumen de docentes" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        <StatCard icono="person_book" etiqueta="Docentes" valor={docentes.length} tono="vino" chip="Registrados" />
        <StatCard icono="wb_sunny" etiqueta="Mañana" valor={enManana} tono="dorado" chip="Jornada" />
        <StatCard icono="wb_twilight" etiqueta="Tarde / completa" valor={tardeOComp} tono="azul" chip="Jornada" />
        <StatCard icono="school" etiqueta="Grupos libres" valor={`${libres} de ${grados.length}`} tono="verde" chip="Por asignar" />
      </section>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-5">
        <Tarjeta titulo="Registrar docente" subtitulo="Los campos con * son obligatorios" className="flex-[1_1_440px]">
          {submitError && <Mensaje tipo="error">{submitError}</Mensaje>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo etiqueta="Cédula" id="cedula" requerido error={errors.cedula}>
              <input id="cedula" name="cedula" value={form.cedula} onChange={handleChange}
                placeholder="Número de cédula" inputMode="numeric" className={err('cedula')} />
            </Campo>
            <Campo etiqueta="Nombre completo" id="nombre" requerido error={errors.nombre}>
              <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Nombres y apellidos" className={err('nombre')} />
            </Campo>
            <Campo etiqueta="Teléfono" id="telefono">
              <input id="telefono" name="telefono" type="tel" value={form.telefono} onChange={handleChange}
                placeholder="300 000 0000" className={claseInput} />
            </Campo>
            <Campo etiqueta="Correo electrónico" id="correo">
              <input id="correo" name="correo" type="email" value={form.correo} onChange={handleChange}
                placeholder="correo@ejemplo.com" className={claseInput} />
            </Campo>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-tinta-media">Jornada laboral<span className="text-rojo" aria-hidden="true"> *</span></p>
            <div role="group" aria-label="Jornada laboral" className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2.5">
              <JornadaBtn value="MAÑANA"   icon="wb_sunny"     desc="6:00 a.m. – 12:00 m."
                selected={form.jornada === 'MAÑANA'}   disabled={false} onSelect={handleJornada} />
              <JornadaBtn value="TARDE"    icon="wb_twilight"  desc="12:00 m. – 6:00 p.m."
                selected={form.jornada === 'TARDE'}    disabled={false} onSelect={handleJornada} />
              <JornadaBtn value="COMPLETA" icon="brightness_5" desc="6:00 a.m. – 6:00 p.m."
                selected={form.jornada === 'COMPLETA'} disabled={false} onSelect={handleJornada} />
            </div>
            {errors.jornada && (
              <p className="text-xs font-medium text-rojo flex items-center gap-1" role="alert">
                <Icono nombre="error" className="text-[15px]" />{errors.jornada}
              </p>
            )}
          </div>

          {form.jornada && form.nombreGrado && (
            <Mensaje tipo="exito">
              <strong>{form.nombre || 'El docente'}</strong> será director de <strong>{form.nombreGrado}</strong> en
              jornada {JORNADA_LABEL[form.jornada as JornadaDocente].toLowerCase()}.
              {form.jornada === 'COMPLETA' && ' Se asignará a los dos grupos del grado (mañana y tarde).'}
            </Mensaje>
          )}

          <div className="flex gap-2.5">
            <Boton onClick={limpiar} className="border border-linea">Limpiar</Boton>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-[14px] bg-vino text-white text-sm font-semibold
                hover:bg-vino-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              <Icono nombre={isSubmitting ? 'progress_activity' : 'person_add'} className={`text-[19px] ${isSubmitting ? 'animate-spin' : ''}`} />
              {isSubmitting ? 'Guardando…' : 'Registrar docente'}
            </button>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Grado a dirigir"
          subtitulo={form.jornada ? 'Elige un grado libre en la jornada del docente' : 'Primero elige la jornada del docente'}
          className="flex-[1_1_440px]">
          {loadingGrados ? (
            <Cargando texto="Cargando grados…" />
          ) : (
            <DisponibilidadGrid grados={grados} gradoSeleccionado={form.nombreGrado}
              jornadaSeleccionada={form.jornada} onSelect={handleGrado} />
          )}
          {errors.nombreGrado && (
            <p className="text-xs font-medium text-rojo flex items-center gap-1" role="alert">
              <Icono nombre="error" className="text-[15px]" />{errors.nombreGrado}
            </p>
          )}
        </Tarjeta>
      </form>

      <div className="flex flex-col">
        <h2 className="m-0 text-base md:text-xl font-semibold">Docentes registrados</h2>
        <span className="text-sm text-tinta-suave">{docentes.length} docente{docentes.length !== 1 ? 's' : ''}</span>
      </div>

      {docentes.length === 0 ? (
        <Aviso icono="person_off" titulo="Aún no hay docentes registrados" />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3 sm:gap-4">
          {docentes.map((d, i) => (
            <DocenteCard key={d.cedula} docente={d} indice={i} onEditar={abrirEdicion}
              onRestablecerClave={(doc) => clave.pedir({ tipo: 'docente', cedula: doc.cedula, nombre: doc.nombre })} />
          ))}
        </div>
      )}
    </>
  );
};

export default DocentesPage;