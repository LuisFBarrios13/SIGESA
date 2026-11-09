// src/pages/admin/PagosPage.tsx
// Tarifas del año, búsqueda del estudiante y su cuenta. Datos: usePagos (sin cambios).
import { usePagos } from '../../hooks/usePagos';
import TarifaSection  from '../../components/pagos/TarifaSection';
import SearchSection  from '../../components/pagos/SearchSection';
import PagosSection   from '../../components/pagos/PagosSection';
import PagoModal      from '../../components/pagos/PagoModal';
import TarifaModal    from '../../components/pagos/TarifaModal';
import PageHeader from '../../components/ds/PageHeader';
import { SelectPill } from '../../components/ds/Controles';
import { Cargando } from '../../components/ds/Estados';
import { opcionesAnio } from '../../utils/anios';

const PagosPage = () => {
  const {
    searchQuery, setSearchQuery,
    yearFilter,  setYearFilter,
    searchResults, isSearching,
    resumen, isLoadingResumen,
    selectMatricula, clearSelection,
    metodos, metodosError,
    tarifa, isTarifaLoading, openTarifaModal,
    modal, openPagoModal, closeModal,
    opLoading, opError,
    registrarPago, generarPension, crearMatricula, saveTarifa,
    estadoFilter, setEstadoFilter, cuentasFiltradas,
  } = usePagos();

  return (
    <>
      {modal?.type === 'pago' && (
        <PagoModal cuenta={modal.cuenta} metodos={metodos} metodosError={metodosError}
          opLoading={opLoading} opError={opError} onConfirm={registrarPago} onClose={closeModal} />
      )}
      {modal?.type === 'tarifa' && (
        <TarifaModal year={modal.year} tarifa={modal.tarifa}
          opLoading={opLoading} opError={opError} onConfirm={saveTarifa} onClose={closeModal} />
      )}

      <PageHeader titulo="Pagos" subtitulo="Configura las tarifas del año y gestiona los cobros de cada estudiante"
        acciones={
          <SelectPill etiqueta="Año" value={yearFilter} opciones={opcionesAnio(-1, 5)}
            onChange={(e) => setYearFilter(Number(e.target.value))} className="w-full lg:w-auto" />
        } />

      <TarifaSection tarifa={tarifa} year={yearFilter} isLoading={isTarifaLoading} onEdit={openTarifaModal} />

      {!resumen && !isLoadingResumen && (
        <SearchSection query={searchQuery} setQuery={setSearchQuery} results={searchResults}
          isSearching={isSearching} onSelect={selectMatricula} />
      )}

      {isLoadingResumen && <Cargando texto="Cargando la cuenta del estudiante…" />}

      {resumen && (
        <PagosSection
          key={resumen.matricula.id_matricula}
          resumen={resumen}
          cuentasFiltradas={cuentasFiltradas}
          estadoFilter={estadoFilter}
          setEstadoFilter={setEstadoFilter}
          onPagar={openPagoModal}
          onPension={generarPension}
          onMatricula={crearMatricula}
          onVolver={clearSelection}
          year={yearFilter}
          opLoading={opLoading}
          opError={opError}
          tarifa={tarifa}
          onEditTarifa={openTarifaModal}
        />
      )}
    </>
  );
};

export default PagosPage;
