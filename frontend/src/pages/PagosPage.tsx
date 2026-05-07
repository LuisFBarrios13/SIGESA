// src/pages/PagosPage.tsx
import { usePagos } from '../hooks/usePagos';

import TarifaSection  from '../components/pagos/TarifaSection';
import SearchSection  from '../components/pagos/SearchSection';
import PagosSection   from '../components/pagos/PagosSection';
import PagoModal      from '../components/pagos/PagoModal';
import TarifaModal    from '../components/pagos/TarifaModal';

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
      {/* ── Modals ───────────────────────────────────────────── */}
      {modal?.type === 'pago' && (
        <PagoModal
          cuenta={modal.cuenta}
          metodos={metodos}
          metodosError={metodosError}
          opLoading={opLoading}
          opError={opError}
          onConfirm={registrarPago}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'tarifa' && (
        <TarifaModal
          year={modal.year}
          tarifa={modal.tarifa}
          opLoading={opLoading}
          opError={opError}
          onConfirm={saveTarifa}
          onClose={closeModal}
        />
      )}

      {/* ── Page header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-semibold text-primary">Gestión de Pagos</h1>
        <p className="text-base text-stone-500 mt-1">
          Configura las tarifas del año y gestiona los cobros de cada estudiante
        </p>
      </div>

      {/* ── Sections ─────────────────────────────────────────── */}
      <div className="space-y-5">
        <TarifaSection
          tarifa={tarifa}
          year={yearFilter}
          setYear={setYearFilter}
          isLoading={isTarifaLoading}
          onEdit={openTarifaModal}
        />

        {!resumen && !isLoadingResumen && (
          <SearchSection
            query={searchQuery}
            setQuery={setSearchQuery}
            results={searchResults}
            isSearching={isSearching}
            onSelect={selectMatricula}
          />
        )}

        {isLoadingResumen && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm
            flex items-center justify-center min-h-[200px] gap-3 text-stone-400">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">
              progress_activity
            </span>
            <p className="text-sm">Cargando información de pagos…</p>
          </div>
        )}

        {resumen && (
          <PagosSection
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
      </div>
    </>
  );
};

export default PagosPage;