// src/pages/admin/MatriculaPage.tsx
// Formulario de matrícula nueva en tres pasos y un resumen lateral.
// El estado, la validación y el envío viven en useMatriculaForm (sin cambios).
// El resumen solo lee la tarifa del año elegido para mostrar el total.
import { useQuery } from '@tanstack/react-query';
import JornadaOption        from '../../components/matricula/JornadaOption';
import SuccessModal         from '../../components/matricula/MatriculaSuccessModal';
import { useMatriculaForm } from '../../hooks/useMatriculaForm';
import { pagosApi }         from '../../services/pagosApi';
import { queryKeys }        from '../../lib/queryKeys';
import PageHeader from '../../components/ds/PageHeader';
import { Campo, PasoFormulario } from '../../components/ds/Campo';
import { claseInput, claseInputError, claseSelect } from '../../components/ds/campo-estilos';
import { Boton, Icono } from '../../components/ds/Controles';
import { Mensaje } from '../../components/ds/Estados';

const RH = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const PARENTESCOS = ['Padre', 'Madre', 'Abuelo/a', 'Tío/a', 'Hermano/a', 'Tutor legal', 'Otro'];

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const Fila = ({ etiqueta, valor }: { etiqueta: string; valor: string }) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-tinta-suave">{etiqueta}</span>
    <span className="font-semibold text-tinta text-right break-words min-w-0">{valor || '—'}</span>
  </div>
);

const MatriculaPage = () => {
  const {
    form, errors,
    grados, isLoadingGrados, gradosLoadError,
    isSubmitting, submitError,
    successData, cerrarExito,
    acudienteEncontrado, buscandoAcudiente, camposAcudienteReadonly,
    yearOptions,
    handleChange, handleJornadaSelect, handleSubmit,
    limpiarAcudiente, resetForm,
  } = useMatriculaForm();

  const year = Number(form.year);
  const tarifaQuery = useQuery({
    queryKey: queryKeys.pagos.tarifa(year),
    queryFn:  () => pagosApi.getTarifa(year),
    enabled:  !!year,
  });
  const tarifa = tarifaQuery.data ?? null;
  const pension   = tarifa ? Number(tarifa.valor_pension) : 0;
  const matricula = tarifa ? Number(tarifa.valor_matricula) : 0;

  const grado = grados.find((g) => String(g.id_grado) === String(form.id_grado));
  const clase = (campo: keyof typeof errors) => (errors[campo] ? claseInputError : claseInput);
  const soloLectura = camposAcudienteReadonly ? ' text-tinta-media' : '';

  return (
    <>
      {successData && (
        <SuccessModal credenciales={successData.credenciales} acudienteNuevo={successData.acudienteNuevo} onClose={cerrarExito} />
      )}

      <PageHeader titulo="Nueva matrícula" subtitulo="Registra al estudiante, asigna el grado y configura el acceso del acudiente" />

      {submitError && <Mensaje tipo="error">{submitError}</Mensaje>}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-5">
        <div className="flex-[999_1_560px] min-w-0 flex flex-col gap-5">

          {/* ── Paso 1: estudiante ── */}
          <PasoFormulario paso={1} titulo="Datos del estudiante" icono="person" nota="* obligatorio">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo etiqueta="Número de identidad" id="numero_identidad" requerido error={errors.numero_identidad}>
                <input id="numero_identidad" name="numero_identidad" value={form.numero_identidad} onChange={handleChange}
                  placeholder="Ej. 1122918322" inputMode="numeric" className={clase('numero_identidad')} />
              </Campo>
              <Campo etiqueta="Nombre completo" id="nombre_estudiante" requerido error={errors.nombre_estudiante}>
                <input id="nombre_estudiante" name="nombre_estudiante" value={form.nombre_estudiante} onChange={handleChange}
                  placeholder="Nombres y apellidos" className={clase('nombre_estudiante')} />
              </Campo>
              <Campo etiqueta="Fecha de nacimiento" id="fecha_nacimiento" requerido error={errors.fecha_nacimiento}>
                <input id="fecha_nacimiento" name="fecha_nacimiento" type="date" value={form.fecha_nacimiento}
                  onChange={handleChange} className={clase('fecha_nacimiento')} />
              </Campo>
              <Campo etiqueta="Tipo de sangre (RH)" id="rh">
                <select id="rh" name="rh" value={form.rh} onChange={handleChange} className={claseSelect}>
                  <option value="">Seleccionar</option>
                  {RH.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="Dirección" id="direccion_estudiante" ancho>
                <input id="direccion_estudiante" name="direccion_estudiante" value={form.direccion_estudiante}
                  onChange={handleChange} placeholder="Dirección de residencia" className={claseInput} />
              </Campo>
              <Campo etiqueta="Observaciones" id="observaciones" ancho>
                <textarea id="observaciones" name="observaciones" value={form.observaciones} onChange={handleChange} rows={2}
                  placeholder="Condiciones médicas, necesidades especiales…" className={`${claseInput} py-3 resize-none`} />
              </Campo>
            </div>
          </PasoFormulario>

          {/* ── Paso 2: matrícula ── */}
          <PasoFormulario paso={2} titulo="Datos de matrícula" icono="school">
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-semibold text-tinta-media">Jornada<span className="text-rojo" aria-hidden="true"> *</span></p>
              <div role="group" aria-label="Jornada" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <JornadaOption value="MAÑANA" label="Jornada mañana" icon="wb_sunny"
                  horarios={['Preescolar 7:00 a.m. – 11:30 a.m.', 'Primaria 6:30 a.m. – 11:45 a.m.']}
                  selected={form.jornada === 'MAÑANA'} onSelect={handleJornadaSelect} />
                <JornadaOption value="TARDE" label="Jornada tarde" icon="wb_twilight"
                  horarios={['Preescolar 1:00 p.m. – 5:30 p.m.', 'Primaria 12:40 p.m. – 5:40 p.m.']}
                  selected={form.jornada === 'TARDE'} onSelect={handleJornadaSelect} />
              </div>
              {errors.jornada && (
                <p className="text-xs font-medium text-rojo flex items-center gap-1" role="alert">
                  <Icono nombre="error" className="text-[15px]" />{errors.jornada}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo etiqueta="Grado" id="id_grado" requerido error={errors.id_grado || gradosLoadError}>
                <select id="id_grado" name="id_grado" value={form.id_grado} onChange={handleChange}
                  className={errors.id_grado ? `${claseInputError} cursor-pointer` : claseSelect}
                  disabled={!form.jornada || isLoadingGrados}>
                  <option value="" disabled>
                    {isLoadingGrados ? 'Cargando grados…' : form.jornada ? 'Seleccionar grado' : 'Primero elige la jornada'}
                  </option>
                  {grados.filter((g) => !form.jornada || g.jornada === form.jornada)
                    .map((g) => <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="Año lectivo" id="year" requerido error={errors.year}>
                <select id="year" name="year" value={form.year} onChange={handleChange} className={claseSelect}>
                  {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </Campo>
            </div>
          </PasoFormulario>

          {/* ── Paso 3: acudiente ── */}
          <PasoFormulario paso={3} titulo="Datos del acudiente" icono="family_restroom">
            {acudienteEncontrado ? (
              <Mensaje tipo="exito">
                <strong>Acudiente encontrado.</strong> Sus datos se completaron solos; se vinculará al estudiante
                y conserva su usuario y contraseña actuales.
              </Mensaje>
            ) : (
              <Mensaje tipo="info">
                <strong>Acceso automático.</strong> Si el acudiente es nuevo, su usuario y contraseña temporal serán el
                número de identidad del estudiante.
              </Mensaje>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo etiqueta="Cédula del acudiente" id="cedula_acudiente" requerido error={errors.cedula_acudiente}>
                <div className="relative">
                  <input id="cedula_acudiente" name="cedula_acudiente" value={form.cedula_acudiente} onChange={handleChange}
                    placeholder="Número de cédula" inputMode="numeric" className={`${clase('cedula_acudiente')} pr-11`} />
                  {buscandoAcudiente && (
                    <Icono nombre="progress_activity" className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-vino text-xl" />
                  )}
                  {acudienteEncontrado && !buscandoAcudiente && (
                    <Icono nombre="check_circle" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-verde text-xl" />
                  )}
                </div>
              </Campo>
              <Campo etiqueta="Nombre completo" id="nombre_acudiente" requerido error={errors.nombre_acudiente}>
                <input id="nombre_acudiente" name="nombre_acudiente" value={form.nombre_acudiente} onChange={handleChange}
                  placeholder="Nombres y apellidos" readOnly={camposAcudienteReadonly}
                  className={clase('nombre_acudiente') + soloLectura} />
              </Campo>
              <Campo etiqueta="Teléfono" id="telefono_acudiente">
                <input id="telefono_acudiente" name="telefono_acudiente" type="tel" value={form.telefono_acudiente}
                  onChange={handleChange} placeholder="300 000 0000" readOnly={camposAcudienteReadonly}
                  className={claseInput + soloLectura} />
              </Campo>
              <Campo etiqueta="Correo electrónico" id="correo_acudiente">
                <input id="correo_acudiente" name="correo_acudiente" type="email" value={form.correo_acudiente}
                  onChange={handleChange} placeholder="correo@ejemplo.com" readOnly={camposAcudienteReadonly}
                  className={claseInput + soloLectura} />
              </Campo>
              <Campo etiqueta="Dirección" id="direccion_acudiente">
                <input id="direccion_acudiente" name="direccion_acudiente" value={form.direccion_acudiente}
                  onChange={handleChange} placeholder="Dirección" readOnly={camposAcudienteReadonly}
                  className={claseInput + soloLectura} />
              </Campo>
              <Campo etiqueta="Parentesco" id="parentesco">
                <select id="parentesco" name="parentesco" value={form.parentesco} onChange={handleChange} className={claseSelect}>
                  <option value="">Seleccionar</option>
                  {PARENTESCOS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Campo>
            </div>
            {acudienteEncontrado && (
              <button type="button" onClick={limpiarAcudiente}
                className="self-start text-sm font-semibold text-tinta-suave hover:text-rojo flex items-center gap-1">
                <Icono nombre="close" className="text-base" />Usar otro acudiente
              </button>
            )}
          </PasoFormulario>
        </div>

        {/* ── Resumen lateral ── */}
        <aside className="flex-[1_1_300px] min-w-0 lg:sticky lg:top-[3.25rem]">
          <section aria-label="Resumen de la matrícula" className="bg-tarjeta rounded-[22px] md:rounded-[24px] p-[18px] md:p-[26px] flex flex-col gap-3.5">
            <h2 className="m-0 text-lg font-semibold">Resumen</h2>
            <Fila etiqueta="Estudiante" valor={form.nombre_estudiante.trim()} />
            <Fila etiqueta="Jornada" valor={form.jornada === 'MAÑANA' ? 'Mañana' : form.jornada === 'TARDE' ? 'Tarde' : ''} />
            <Fila etiqueta="Grado" valor={grado?.nombre ?? ''} />
            <Fila etiqueta="Año lectivo" valor={String(form.year)} />
            <Fila etiqueta="Acudiente" valor={form.nombre_acudiente.trim()} />

            <div className="h-px bg-linea my-1" />
            <span className="text-[13px] font-semibold text-tinta-suave">Tarifas {form.year}</span>
            {tarifaQuery.isLoading && <p className="text-sm text-tinta-suave">Cargando tarifas…</p>}
            {!tarifaQuery.isLoading && !tarifa && (
              <p className="text-sm text-tinta-suave">Aún no hay tarifas para {form.year}. Configúralas en Pagos.</p>
            )}
            {tarifa && (
              <>
                <Fila etiqueta="Matrícula" valor={fmt(matricula)} />
                <Fila etiqueta="Pensión" valor={`${fmt(pension)} × 10`} />
                <div className="flex justify-between gap-3 rounded-[14px] bg-crema px-4 py-3 text-[15px]">
                  <span className="font-semibold">Total del año</span>
                  <span className="font-semibold tabular-nums">{fmt(matricula + pension * 10)}</span>
                </div>
              </>
            )}

            <button type="submit" disabled={isSubmitting}
              className="mt-1 min-h-[52px] rounded-[14px] bg-vino text-white text-[15px] font-semibold flex items-center justify-center gap-2
                hover:bg-vino-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              <Icono nombre={isSubmitting ? 'progress_activity' : 'how_to_reg'} className={`text-xl ${isSubmitting ? 'animate-spin' : ''}`} />
              {isSubmitting ? 'Guardando…' : 'Crear matrícula'}
            </button>
            <Boton onClick={resetForm} className="border border-linea">Limpiar formulario</Boton>
          </section>
        </aside>
      </form>
    </>
  );
};

export default MatriculaPage;
