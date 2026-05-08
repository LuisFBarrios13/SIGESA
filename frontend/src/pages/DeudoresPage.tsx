// src/pages/DeudoresPage.tsx
import { useDeudores } from '../hooks/useDeudores';
import StatsVencidos from '../components/deudores/StatsVencidos';
import DeudorCard    from '../components/deudores/DeudorCard';

const yearOptions = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - 1 + i,
);

const DeudoresPage = () => {
  const {
    isLoading, error,
    search, setSearch,
    yearFilter, setYearFilter,
    filtered, deudores,
    totalDeuda, refresh,
  } = useDeudores();

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Deudores</h1>
          <p className="text-base text-stone-500 mt-1">
            Estudiantes con cuentas vencidas e historial de pagos registrados
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de año */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="px-3 py-2.5 rounded-lg border border-outline-variant bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer font-medium"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-outline-variant
              text-on-surface-variant rounded-lg font-semibold hover:bg-stone-50
              transition-all text-sm disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-lg ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && !error && (
        <StatsVencidos deudores={deudores} totalDeuda={totalDeuda} />
      )}

      {/* Buscador */}
      {!isLoading && !error && deudores.length > 0 && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined
            text-stone-400 text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o número de identidad…"
            className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-outline-variant
              rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30
              focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400
                hover:text-stone-600 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="material-symbols-outlined text-primary animate-spin text-5xl">
            progress_activity
          </span>
          <p className="text-sm text-stone-400">Cargando deudores…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border border-error/20">
          <span className="material-symbols-outlined text-error text-xl">error</span>
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
      )}

      {/* Empty — sin deudores */}
      {!isLoading && !error && deudores.length === 0 && (
        <div className="bg-white rounded-2xl border border-outline-variant shadow-sm
          py-20 flex flex-col items-center gap-4 text-stone-400">
          <span className="material-symbols-outlined text-6xl text-secondary">
            check_circle
          </span>
          <div className="text-center">
            <p className="font-semibold text-sm text-on-surface">
              Sin cuentas vencidas en {yearFilter}
            </p>
            <p className="text-xs mt-1">
              Todos los pagos están al día para el año seleccionado
            </p>
          </div>
        </div>
      )}

      {/* Empty — sin resultados de búsqueda */}
      {!isLoading && !error && deudores.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-outline-variant shadow-sm
          py-16 flex flex-col items-center gap-3 text-stone-400">
          <span className="material-symbols-outlined text-5xl">manage_search</span>
          <p className="text-sm font-medium">
            No se encontró ningún deudor con ese criterio
          </p>
          <button
            onClick={() => setSearch('')}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {/* Lista de deudores */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {/* Contador */}
          <p className="text-xs text-stone-400 px-1">
            {search
              ? `${filtered.length} de ${deudores.length} deudores`
              : `${deudores.length} deudor${deudores.length !== 1 ? 'es' : ''} — ordenados por mayor deuda`
            }
          </p>

          {filtered.map((deudor, index) => (
            <DeudorCard
              key={deudor.estudiante.numero_identidad}
              deudor={deudor}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default DeudoresPage;