// src/pages/acudiente/AcudientePage.tsx
// Portal del acudiente: pagos del estudiante a cargo por año escolar.
// La lógica y las llamadas a la API viven en useAcudiente (sin cambios).
import type { ReactNode } from 'react';
import { useAcudiente } from '../../hooks/useAcudiente';
import PageHeader  from '../../components/ds/PageHeader';
import HeroBanner, { type HeroChip } from '../../components/ds/HeroBanner';
import StatCard    from '../../components/ds/StatCard';
import { ESTADOS } from '../../components/ds/tonos';
import { SelectorAnio, SelectorEstudiante } from '../../components/acudientes/Selectores';
import PagosPorMes      from '../../components/acudientes/PagosPorMes';
import EstadoCuentaCard from '../../components/acudientes/EstadoCuentaCard';
import DetalleCuotas    from '../../components/acudientes/DetalleCuotas';
import { fmt, prepararCuotas, resumirCuotas } from '../../components/acudientes/cuotas';

const Aviso = ({ icono, titulo, texto, children }: {
  icono: string; titulo: string; texto?: string; children?: ReactNode;
}) => (
  <div className="bg-tarjeta rounded-card py-14 px-6 flex flex-col items-center gap-3 text-center">
    <span aria-hidden="true" className="material-symbols-outlined text-5xl text-tinta-suave">{icono}</span>
    <p className="text-sm font-bold text-tinta">{titulo}</p>
    {texto && <p className="text-sm text-tinta-suave max-w-sm">{texto}</p>}
    {children}
  </div>
);

const Cargando = ({ texto }: { texto: string }) => (
  <div role="status" className="bg-tarjeta rounded-card py-14 flex flex-col items-center gap-3 text-tinta-suave">
    <span aria-hidden="true" className="material-symbols-outlined animate-spin text-vino text-4xl">progress_activity</span>
    <p className="text-sm">{texto}</p>
  </div>
);

const AcudientePage = () => {
  const {
    perfil, isLoading, error,
    selected, selectStudent,
    matricula, selectMatricula,
    resumen, isLoadingResumen, resumenError,
    refresh,
  } = useAcudiente();

  const acciones = selected && (
    <SelectorAnio matriculas={selected.matriculas} seleccionada={matricula} onSelect={selectMatricula} />
  );

  if (isLoading) {
    return (<><PageHeader titulo="Mis pagos" /><Cargando texto="Cargando información…" /></>);
  }

  if (error) {
    return (
      <>
        <PageHeader titulo="Mis pagos" />
        <Aviso icono="error" titulo="No se pudo cargar la información" texto={error}>
          <button type="button" onClick={refresh}
            className="mt-2 min-h-11 px-5 rounded-xl bg-tinta text-white text-sm font-bold flex items-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-lg">refresh</span>
            Reintentar
          </button>
        </Aviso>
      </>
    );
  }

  if (!perfil) return null;

  if (!perfil.estudiantes.length) {
    return (
      <>
        <PageHeader titulo="Mis pagos" />
        <Aviso icono="group_off" titulo="Sin estudiantes vinculados" texto="Comunícate con la secretaría del colegio." />
      </>
    );
  }

  const cuotas  = resumen ? prepararCuotas(resumen.cuentas) : [];
  const conteo  = resumirCuotas(cuotas);
  const totales = resumen?.totales;
  const pct     = totales && totales.deuda > 0 ? Math.round((totales.pagado / totales.deuda) * 100) : 0;

  const chips: HeroChip[] = matricula ? [
    { texto: matricula.grado.nombre },
    { texto: `Jornada ${matricula.jornada === 'MAÑANA' ? 'mañana' : 'tarde'}` },
    { texto: `Doc. ${selected!.numero_identidad}` },
    { texto: ESTADOS[matricula.estado]?.texto ?? matricula.estado, destacado: matricula.estado === 'ACTIVO' },
  ] : [{ texto: `Doc. ${selected!.numero_identidad}` }];

  return (
    <>
      <PageHeader titulo="Mis pagos" acciones={acciones} />

      <SelectorEstudiante estudiantes={perfil.estudiantes} seleccionado={selected} onSelect={selectStudent} />

      {selected && (
        <HeroBanner
          etiqueta={matricula ? `Año escolar ${matricula.year} · Estudiante a cargo` : 'Estudiante a cargo'}
          titulo={selected.nombre}
          chips={chips}
          escudo
        />
      )}

      {!matricula && <Aviso icono="event_busy" titulo="Este estudiante no tiene matrículas registradas" />}

      {matricula && isLoadingResumen && <Cargando texto="Cargando pagos…" />}

      {matricula && resumenError && !isLoadingResumen && (
        <Aviso icono="error" titulo="No se pudieron cargar los pagos" texto={resumenError}>
          <button type="button" onClick={refresh}
            className="mt-2 min-h-11 px-5 rounded-xl bg-tinta text-white text-sm font-bold">Reintentar</button>
        </Aviso>
      )}

      {matricula && resumen && totales && !isLoadingResumen && (
        <>
          <section aria-label={`Resumen de pagos ${matricula.year}`} className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
            <StatCard icono="receipt_long" etiqueta="Total del año" valor={fmt(totales.deuda)}
              tono="vino" chip={`${conteo.total} cuotas`} />
            <StatCard icono="check_circle" etiqueta="Pagado" valor={fmt(totales.pagado)}
              tono="verde" chip={`${conteo.pagadas} pagadas`} />
            <StatCard icono="schedule" etiqueta="Saldo pendiente" valor={fmt(totales.pendiente)} tono="dorado"
              chip={conteo.vencidas ? `${conteo.vencidas} vencidas` : `${conteo.pendientes} pendientes`}
              chipTono={conteo.vencidas ? 'rojo' : 'dorado'} />
            <StatCard icono="trending_up" etiqueta="Pagado del año" valor={`${pct}%`} tono="tinta" chip="Avance" chipTono="neutro" />
          </section>

          {cuotas.length > 0 && (
            <div className="flex flex-wrap gap-5">
              <div className="hidden md:flex flex-[999_1_520px] min-w-0 [&>*]:w-full"><PagosPorMes cuotas={cuotas} /></div>
              <div className="flex flex-[1_1_300px] min-w-0 [&>*]:w-full">
                <EstadoCuentaCard year={matricula.year} pct={pct} totales={totales} resumen={conteo}
                  pension={resumen.tarifa ? Number(resumen.tarifa.valor_pension) : null} />
              </div>
            </div>
          )}

          <DetalleCuotas cuotas={cuotas} year={matricula.year} />
        </>
      )}
    </>
  );
};

export default AcudientePage;
