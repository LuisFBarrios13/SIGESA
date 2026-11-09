// src/pages/admin/DashboardPage.tsx
// Resumen académico y financiero del año. Datos: useDashboard (sin cambios).
import { Link } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import PageHeader   from '../../components/ds/PageHeader';
import HeroBanner   from '../../components/ds/HeroBanner';
import StatCard     from '../../components/ds/StatCard';
import Tarjeta      from '../../components/ds/Tarjeta';
import GraficaBarras from '../../components/ds/GraficaBarras';
import { Avatar, BotonIcono, Icono, SelectPill } from '../../components/ds/Controles';
import { Aviso, Cargando } from '../../components/ds/Estados';
import { opcionesAnio } from '../../utils/anios';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const DashboardPage = () => {
  const { metrics, isLoading, error, year, setYear, refresh } = useDashboard();

  const acciones = (
    <div className="flex items-center gap-3">
      <SelectPill etiqueta="Año" value={year} opciones={opcionesAnio()}
        onChange={(e) => setYear(Number(e.target.value))} className="flex-1 lg:flex-none" />
      <BotonIcono icono="refresh" etiqueta="Actualizar" onClick={refresh} />
    </div>
  );
  const encabezado = <PageHeader titulo="Dashboard" subtitulo="Resumen académico y financiero" acciones={acciones} />;

  if (isLoading) return <>{encabezado}<Cargando texto="Cargando indicadores…" /></>;
  if (error || !metrics) {
    return <>{encabezado}<Aviso icono="error" titulo="No se pudieron cargar los indicadores" texto={error || 'Sin datos'} /></>;
  }

  const pctRecaudo = metrics.totalDeuda > 0 ? Math.round((metrics.totalRecaudado / metrics.totalDeuda) * 100) : 0;

  return (
    <>
      {encabezado}

      <HeroBanner etiqueta={`Año escolar ${year}`} titulo="Colegio Pedagógico San Agustín" escudo>
        <p className="text-sm sm:text-[15px] text-[#FBEFE6]">
          {metrics.estudiantesActivos} estudiantes activos · {metrics.totalDocentes} docentes
        </p>
        <div className="flex flex-wrap gap-2.5 mt-2">
          <Link to="/matricula"
            className="inline-flex items-center gap-2 min-h-11 px-4 rounded-[14px] bg-white text-tinta text-sm font-semibold hover:bg-white/90">
            <Icono nombre="how_to_reg" className="text-[19px]" />Nueva matrícula
          </Link>
          <Link to="/pagos"
            className="inline-flex items-center gap-2 min-h-11 px-4 rounded-[14px] bg-white/20 text-white text-sm font-semibold hover:bg-white/30">
            <Icono nombre="payments" className="text-[19px]" />Registrar pago
          </Link>
        </div>
      </HeroBanner>

      <section aria-label={`Indicadores ${year}`} className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        <StatCard icono="group" etiqueta="Total estudiantes" valor={metrics.totalEstudiantes}
          tono="vino" chip={`${metrics.estudiantesActivos} activos`} detalle={`en el año ${year}`} />
        <StatCard icono="how_to_reg" etiqueta="Tasa de matrícula" valor={`${metrics.tasaMatricula}%`}
          tono="verde" chip={`${metrics.totalDocentes} docentes`} />
        <StatCard icono="payments" etiqueta="Recaudo del año" valor={fmt(metrics.totalRecaudado)}
          tono="dorado" chip={`${pctRecaudo}%`} detalle={`de ${fmt(metrics.totalDeuda)} facturados`} />
        <StatCard icono="warning" etiqueta="Deudores" valor={`${metrics.totalDeudores} estudiantes`}
          tono="alerta" chip="Vencidas" detalle="con cuentas vencidas" />
      </section>

      <div className="flex flex-wrap gap-5">
        <Tarjeta titulo={`Recaudo mensual ${year}`} className="flex-[999_1_520px]">
          <GraficaBarras
            descripcion={`Recaudo mensual frente a lo facturado en ${year}`}
            formato={fmt}
            series={[{ nombre: 'Recaudado', color: 'bg-verde' }, { nombre: 'Por cobrar', color: 'bg-[#EFE6E0]' }]}
            columnas={metrics.monthlyChart.map((m) => ({
              clave: m.month, etiqueta: m.month.charAt(0) + m.month.slice(1).toLowerCase(), etiquetaCorta: m.month.charAt(0),
              valores: [m.recaudado, Math.max(0, m.deuda - m.recaudado)],
            }))}
          />
        </Tarjeta>

        <Tarjeta titulo="Top deudores" className="flex-[1_1_340px]"
          acciones={<Link to="/deudores" className="text-sm font-semibold text-vino hover:underline">Ver todos</Link>}>
          {metrics.topDeudores.length === 0 ? (
            <Aviso icono="check_circle" titulo={`Sin deudores en ${year}`} enTarjeta={false} />
          ) : (
            <ol className="flex flex-col gap-2.5">
              {metrics.topDeudores.map((d, i) => (
                <li key={d.identidad} className="flex items-center gap-3 rounded-2xl bg-crema px-3.5 py-3">
                  <span className="w-5 text-[13px] font-semibold text-tinta-suave text-center">{i + 1}</span>
                  <Avatar nombre={d.nombre} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-tinta break-words">{d.nombre}</p>
                    <p className="text-xs text-tinta-suave truncate">{d.grado}</p>
                  </div>
                  <span className="text-sm font-semibold text-rojo tabular-nums shrink-0">{fmt(d.saldo)}</span>
                </li>
              ))}
            </ol>
          )}
        </Tarjeta>
      </div>
    </>
  );
};

export default DashboardPage;
