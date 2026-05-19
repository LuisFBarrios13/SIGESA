// src/pages/acudiente/AcudientePage.tsx
import { useAcudiente }       from '../../hooks/useAcudiente';
import WelcomeBanner          from '../../components/acudientes/WelcomeBanner';
import EstudianteSelector     from '../../components/acudientes/EstudianteSelector';
import MatriculaSelector      from '../../components/acudientes/MatriculaSelector';
import ResumenFinanciero      from '../../components/acudientes/ResumenFinanciero';
import CuentasLista           from '../../components/acudientes/CuentasLista';

const ESTADO_COLOR: Record<string, string> = {
  ACTIVO:   'bg-emerald-100 text-emerald-800',
  RETIRADO: 'bg-red-100 text-red-800',
  GRADUADO: 'bg-blue-100 text-blue-800',
};

const AcudientePage = () => {
  const {
    perfil, isLoading, error,
    selected, selectStudent,
    matricula, selectMatricula,
    resumen, isLoadingResumen, resumenError,
    refresh,
  } = useAcudiente();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <span className="material-symbols-outlined text-primary animate-spin text-5xl">
          progress_activity
        </span>
        <p className="text-sm text-stone-400">Cargando información…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="flex items-center gap-3 p-5 bg-error-container rounded-2xl border border-error/20 max-w-md w-full">
          <span className="material-symbols-outlined text-error text-2xl flex-shrink-0">error</span>
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary
            border border-primary/30 rounded-lg hover:bg-primary-fixed/20 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Reintentar
        </button>
      </div>
    );
  }

  if (!perfil) return null;

  if (!perfil.estudiantes.length) {
    return (
      <div className="space-y-5">
        <WelcomeBanner perfil={perfil} />
        <div className="bg-white rounded-2xl border border-outline-variant shadow-sm py-20
          flex flex-col items-center gap-4 text-stone-400">
          <span className="material-symbols-outlined text-6xl">group_off</span>
          <p className="font-semibold text-sm text-on-surface">Sin estudiantes vinculados</p>
          <p className="text-xs">Contacta con el administrador del colegio</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WelcomeBanner perfil={perfil} />

      {/* Solo visible si hay más de un estudiante */}
      <EstudianteSelector
        estudiantes={perfil.estudiantes}
        selected={selected}
        onSelect={selectStudent}
      />

      {selected && (
        <div className="space-y-4">

          {/* Tarjeta de información del estudiante */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-black text-white">
                    {selected.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-lg">{selected.nombre}</h3>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">
                    ID: {selected.numero_identidad}
                  </p>
                  {selected.rh && (
                    <span className="inline-block text-[10px] font-bold bg-red-100 text-red-700
                      px-2 py-0.5 rounded mt-1">
                      {selected.rh}
                    </span>
                  )}
                </div>
              </div>

              <MatriculaSelector
                matriculas={selected.matriculas}
                selected={matricula}
                onSelect={selectMatricula}
              />
            </div>

            {/* Chips de info de la matrícula actual */}
            {matricula && (
              <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-2">
                {[
                  { icon: 'school',         label: 'Grado',   value: matricula.grado.nombre },
                  { icon: 'wb_sunny',       label: 'Jornada', value: matricula.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde' },
                  { icon: 'calendar_today', label: 'Año',     value: String(matricula.year) },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-stone-400 text-base">{icon}</span>
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-on-surface">{value}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-2">
                  <span className="material-symbols-outlined text-stone-400 text-base">flag</span>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Estado</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                      ${ESTADO_COLOR[matricula.estado] ?? 'bg-stone-100 text-stone-600'}`}>
                      {matricula.estado}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sección de pagos */}
          {matricula && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">payments</span>
                Estado de pagos
              </h3>

              {isLoadingResumen && (
                <div className="bg-white rounded-xl border border-outline-variant shadow-sm
                  p-10 flex flex-col items-center gap-3 text-stone-400">
                  <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                    progress_activity
                  </span>
                  <p className="text-sm">Cargando pagos…</p>
                </div>
              )}

              {resumenError && !isLoadingResumen && (
                <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border border-error/20">
                  <span className="material-symbols-outlined text-error text-xl">error</span>
                  <p className="text-sm text-error font-medium">{resumenError}</p>
                </div>
              )}

              {resumen && !isLoadingResumen && (
                <>
                  <ResumenFinanciero
                    totales={resumen.totales}
                    tarifa={resumen.tarifa}
                    year={matricula.year}
                  />
                  <CuentasLista cuentas={resumen.cuentas} />
                </>
              )}
            </div>
          )}

        </div>
      )}
    </>
  );
};

export default AcudientePage;