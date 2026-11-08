// src/pages/admin/MatriculaPage.tsx
import FormField, { inputClass, selectClass } from '../../components/ui/FormField';
import SectionCard           from '../../components/ui/SectionCard';
import JornadaOption         from '../../components/matricula/JornadaOption';
import SuccessModal          from '../../components/matricula/MatriculaSuccessModal';
import { useMatriculaForm }  from '../../hooks/useMatriculaForm';

// ── Main Page ─────────────────────────────────────────────────

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

  return (
    <>
      {successData && (
        <SuccessModal
          credenciales={successData.credenciales}
          acudienteNuevo={successData.acudienteNuevo}
          onClose={cerrarExito}
        />
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Nueva Matrícula</h1>
          <p className="text-base text-stone-500 mt-1">
            Registra al estudiante, asigna el grado y configura el acceso del acudiente
          </p>
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-3 p-4 bg-error-container rounded-xl border border-error/20">
          <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
          <p className="text-sm text-error font-medium">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Sección 1: Estudiante ─────────────────────────── */}
        <SectionCard title="Datos del Estudiante" icon="person" iconBg="bg-primary-fixed" iconColor="text-on-primary-fixed-variant">
          <FormField label="Número de Identidad" id="numero_identidad" required error={errors.numero_identidad}>
            <input id="numero_identidad" name="numero_identidad" value={form.numero_identidad}
              onChange={handleChange} placeholder="ej. 1007123456" className={inputClass} />
          </FormField>

          <FormField label="Nombre Completo" id="nombre_estudiante" required error={errors.nombre_estudiante}>
            <input id="nombre_estudiante" name="nombre_estudiante" value={form.nombre_estudiante}
              onChange={handleChange} placeholder="Nombre y apellidos" className={inputClass} />
          </FormField>

          <FormField label="Fecha de Nacimiento" id="fecha_nacimiento" required error={errors.fecha_nacimiento}>
            <input id="fecha_nacimiento" name="fecha_nacimiento" type="date"
              value={form.fecha_nacimiento} onChange={handleChange} className={inputClass} />
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
              <input id="direccion_estudiante" name="direccion_estudiante"
                value={form.direccion_estudiante} onChange={handleChange}
                placeholder="Dirección de residencia" className={inputClass} />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="Observaciones" id="observaciones">
              <textarea id="observaciones" name="observaciones" value={form.observaciones}
                onChange={handleChange} rows={2}
                placeholder="Condiciones médicas, necesidades especiales, etc."
                className={inputClass + ' resize-none'} />
            </FormField>
          </div>
        </SectionCard>

        {/* ── Sección 2: Matrícula ──────────────────────────── */}
        <SectionCard title="Datos de Matrícula" icon="school" iconBg="bg-tertiary-fixed" iconColor="text-tertiary">
          <div className="md:col-span-2">
            <p className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase mb-3">
              Jornada del Estudiante <span className="text-error ml-1">*</span>
            </p>
            <div className="flex gap-3">
              <JornadaOption value="MAÑANA" label="Jornada Mañana"
                description="Preescolar 7:00 a.m. – 11:30 m. / Primaria 6:30 a.m. – 11:45 a.m."
                icon="wb_sunny" selected={form.jornada === 'MAÑANA'} onSelect={handleJornadaSelect} />
              <JornadaOption value="TARDE" label="Jornada Tarde"
                description="Preescolar 1:00 p.m. – 5:30 p.m. / Primaria 12:40 p.m. – 5:40 p.m."
                icon="wb_twilight" selected={form.jornada === 'TARDE'} onSelect={handleJornadaSelect} />
            </div>
            {errors.jornada && (
              <p className="text-xs text-error font-medium flex items-center gap-1 mt-2">
                <span className="material-symbols-outlined text-[14px]">error</span>{errors.jornada}
              </p>
            )}
          </div>

          <FormField label="Grado" id="id_grado" required error={errors.id_grado || gradosLoadError}>
            <select id="id_grado" name="id_grado" value={form.id_grado} onChange={handleChange}
              className={selectClass} disabled={!form.jornada || isLoadingGrados}>
              <option value="" disabled>
                {isLoadingGrados ? 'Cargando grados...' : form.jornada ? 'Selecciona un grado' : 'Primero selecciona la jornada'}
              </option>
              {grados
                .filter((g) => !form.jornada || g.jornada === form.jornada)
                .map((g) => (
                  <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>
                ))}
            </select>
          </FormField>

          <FormField label="Año Lectivo" id="year" required error={errors.year}>
            <select id="year" name="year" value={form.year} onChange={handleChange} className={selectClass}>
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </FormField>
        </SectionCard>

        {/* ── Sección 3: Acudiente ──────────────────────────── */}
        <SectionCard title="Datos del Acudiente" icon="family_restroom" iconBg="bg-secondary-fixed" iconColor="text-on-secondary-container">

          {/* Aviso de credenciales / acudiente existente */}
          <div className="md:col-span-2">
            {acudienteEncontrado ? (
              <div className="flex gap-3 p-4 bg-secondary-container/20 rounded-xl border border-secondary/20">
                <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0">link</span>
                <div>
                  <p className="text-xs font-bold text-secondary">Acudiente encontrado en el sistema</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Los datos se auto-completaron. Este acudiente ya tiene acceso al sistema y se vinculará
                    automáticamente al nuevo estudiante con sus credenciales actuales.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <span className="material-symbols-outlined text-orange-700 text-xl flex-shrink-0">key</span>
                <div>
                  <p className="text-xs font-semibold text-orange-900">Credenciales automáticas</p>
                  <p className="text-xs text-orange-700 mt-0.5">
                    Si el acudiente es nuevo, se creará su acceso automáticamente. El usuario y contraseña
                    temporal serán el <strong>número de identidad del estudiante</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cédula con indicador de búsqueda */}
          <FormField label="Cédula del Acudiente" id="cedula_acudiente" required error={errors.cedula_acudiente}>
            <div className="relative">
              <input id="cedula_acudiente" name="cedula_acudiente" value={form.cedula_acudiente}
                onChange={handleChange} placeholder="Número de cédula"
                className={inputClass + ' pr-10'} />
              {buscandoAcudiente && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined
                  text-primary animate-spin text-xl">progress_activity</span>
              )}
              {acudienteEncontrado && !buscandoAcudiente && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined
                  text-secondary text-xl">check_circle</span>
              )}
            </div>
          </FormField>

          <FormField label="Nombre Completo" id="nombre_acudiente" required error={errors.nombre_acudiente}>
            <input id="nombre_acudiente" name="nombre_acudiente" value={form.nombre_acudiente}
              onChange={handleChange} placeholder="Nombre y apellidos del acudiente"
              className={inputClass + (camposAcudienteReadonly ? ' bg-stone-50 text-stone-500' : '')}
              readOnly={camposAcudienteReadonly} />
          </FormField>

          <FormField label="Teléfono" id="telefono_acudiente">
            <input id="telefono_acudiente" name="telefono_acudiente" type="tel"
              value={form.telefono_acudiente} onChange={handleChange}
              placeholder="ej. 3001234567"
              className={inputClass + (camposAcudienteReadonly ? ' bg-stone-50 text-stone-500' : '')}
              readOnly={camposAcudienteReadonly} />
          </FormField>

          <FormField label="Correo Electrónico" id="correo_acudiente">
            <input id="correo_acudiente" name="correo_acudiente" type="email"
              value={form.correo_acudiente} onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className={inputClass + (camposAcudienteReadonly ? ' bg-stone-50 text-stone-500' : '')}
              readOnly={camposAcudienteReadonly} />
          </FormField>

          <FormField label="Dirección" id="direccion_acudiente">
            <input id="direccion_acudiente" name="direccion_acudiente"
              value={form.direccion_acudiente} onChange={handleChange}
              placeholder="Dirección del acudiente"
              className={inputClass + (camposAcudienteReadonly ? ' bg-stone-50 text-stone-500' : '')}
              readOnly={camposAcudienteReadonly} />
          </FormField>

          <FormField label="Parentesco" id="parentesco">
            <select id="parentesco" name="parentesco" value={form.parentesco}
              onChange={handleChange} className={selectClass}>
              <option value="">Seleccionar</option>
              {['Padre', 'Madre', 'Abuelo/a', 'Tío/a', 'Hermano/a', 'Tutor legal', 'Otro'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </FormField>

          {/* Botón para limpiar el acudiente encontrado */}
          {acudienteEncontrado && (
            <div className="md:col-span-2">
              <button type="button"
                onClick={limpiarAcudiente}
                className="text-xs text-stone-400 hover:text-error transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                Limpiar y usar otro acudiente
              </button>
            </div>
          )}
        </SectionCard>

        {/* ── Submit ────────────────────────────────────────── */}
        <div className="flex gap-4 justify-end pb-6">
          <button type="button"
            onClick={resetForm}
            className="px-6 py-3 bg-white border border-outline-variant text-on-surface-variant
              rounded-lg font-semibold hover:bg-stone-50 transition-all">
            Limpiar formulario
          </button>
          <button type="submit" disabled={isSubmitting}
            className="px-8 py-3 bg-orange-900 text-white rounded-lg font-semibold
              hover:bg-primary transition-all shadow-md hover:shadow-lg
              disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
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