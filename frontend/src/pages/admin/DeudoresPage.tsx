// src/pages/admin/DeudoresPage.tsx
// Estudiantes con cuentas vencidas en el año elegido. Datos: useDeudores (sin cambios).
import { useDeudores } from '../../hooks/useDeudores';
import DeudorCard from '../../components/deudores/DeudorCard';
import PageHeader from '../../components/ds/PageHeader';
import StatCard   from '../../components/ds/StatCard';
import { Boton, Buscador, SelectPill } from '../../components/ds/Controles';
import { Aviso, Cargando } from '../../components/ds/Estados';
import { fmt } from '../../components/pagos/pagos.constants';
import { opcionesAnio } from '../../utils/anios';

const DeudoresPage = () => {
  const {
    isLoading, error,
    search, setSearch,
    yearFilter, setYearFilter,
    filtered, deudores,
    totalDeuda, refresh,
  } = useDeudores();

  const totalCuentas = deudores.reduce((s, d) => s + d.cuentas_vencidas.length, 0);
  const conParciales = deudores.filter((d) => d.cuentas_vencidas.some((c) => c.pagos.length > 0)).length;

  const acciones = (
    <div className="flex items-center gap-3">
      <SelectPill etiqueta="Año" value={yearFilter} opciones={opcionesAnio(-1, 5)}
        onChange={(e) => setYearFilter(Number(e.target.value))} className="flex-1 lg:flex-none" />
      <Boton icono="refresh" onClick={refresh} disabled={isLoading} className="min-h-[52px] rounded-full">
        Actualizar
      </Boton>
    </div>
  );

  return (
    <>
      <PageHeader titulo="Deudores" subtitulo="Estudiantes con cuentas vencidas e historial de pagos" acciones={acciones} />

      {isLoading && <Cargando texto="Cargando deudores…" />}
      {error && <Aviso icono="error" titulo="No se pudieron cargar los deudores" texto={error} />}

      {!isLoading && !error && (
        <section aria-label="Resumen de cartera" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
          <StatCard icono="group" etiqueta="Estudiantes" valor={deudores.length} tono="alerta" chip="Con deuda" />
          <StatCard icono="receipt_long" etiqueta="Cuentas vencidas" valor={totalCuentas} tono="vino" chip="Vencidas" />
          <StatCard icono="account_balance_wallet" etiqueta="Total vencido" valor={fmt(totalDeuda)} tono="dorado" chip="Por cobrar" />
          <StatCard icono="payments" etiqueta="Con pagos parciales" valor={conParciales} tono="azul" chip="Parciales" />
        </section>
      )}

      {!isLoading && !error && deudores.length === 0 && (
        <Aviso icono="check_circle" titulo={`Sin cuentas vencidas en ${yearFilter}`}
          texto="Todos los pagos están al día para el año seleccionado." />
      )}

      {!isLoading && !error && deudores.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Buscador valor={search} onCambio={setSearch} etiqueta="Buscar deudor"
              placeholder="Buscar por nombre o número de identidad" className="flex-[1_1_320px]" />
            <span className="text-sm text-tinta-suave">
              {search
                ? `${filtered.length} de ${deudores.length} deudores`
                : `${deudores.length} deudor${deudores.length !== 1 ? 'es' : ''} · ordenados por mayor deuda`}
            </span>
          </div>

          {filtered.length === 0 ? (
            <Aviso icono="manage_search" titulo="Ningún deudor coincide con la búsqueda">
              <button type="button" onClick={() => setSearch('')} className="text-sm font-semibold text-vino hover:underline">
                Limpiar búsqueda
              </button>
            </Aviso>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((deudor, index) => (
                <DeudorCard key={deudor.estudiante.numero_identidad} deudor={deudor} rank={index + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default DeudoresPage;
