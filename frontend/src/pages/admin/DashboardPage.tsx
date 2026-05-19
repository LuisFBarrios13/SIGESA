import { useDashboard } from '../../hooks/useDashboard';

const YEAR_OPTIONS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 1 + i);

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n);

const DashboardPage = () => {
  const { metrics, isLoading, error, year, setYear, refresh } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="material-symbols-outlined text-primary animate-spin text-5xl">
          progress_activity
        </span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border border-error/20">
        <span className="material-symbols-outlined text-error text-xl">error</span>
        <p className="text-sm text-error font-medium">{error || 'Sin datos'}</p>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total estudiantes',
      value: String(metrics.totalEstudiantes),
      sub:   `${metrics.estudiantesActivos} activos en ${year}`,
      icon:  'group',
      bg:    'bg-primary-fixed',
      text:  'text-on-primary-fixed-variant',
    },
    {
      label:    'Tasa de matrícula',
      value:    `${metrics.tasaMatricula}%`,
      sub:      `${metrics.totalDocentes} docentes registrados`,
      icon:     'how_to_reg',
      bg:       'bg-tertiary-fixed',
      text:     'text-tertiary',
      progress: metrics.tasaMatricula,
    },
    {
      label: 'Recaudo del año',
      value: fmt(metrics.totalRecaudado),
      sub:   `de ${fmt(metrics.totalDeuda)} en deuda`,
      icon:  'payments',
      bg:    'bg-secondary-fixed',
      text:  'text-on-secondary-container',
    },
    {
      label: 'Deudores',
      value: `${metrics.totalDeudores} estudiantes`,
      sub:   'con cuentas vencidas',
      icon:  'warning',
      bg:    'bg-error-container',
      text:  'text-error',
      alert: true,
    },
  ];

  const maxDeuda = Math.max(...metrics.monthlyChart.map((m) => m.deuda), 1);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Dashboard</h1>
          <p className="text-base text-stone-500 mt-1">Resumen académico y financiero</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-outline-variant bg-white text-sm
              font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={refresh}
            className="p-2 border border-outline-variant rounded-lg text-stone-400
              hover:text-primary hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map(({ label, value, sub, icon, bg, text, progress, alert }) => (
          <div
            key={label}
            className={`p-6 rounded-xl border shadow-sm flex flex-col justify-between
              ${alert
                ? 'bg-error-container/20 border-error/20'
                : 'bg-surface-container-lowest border-outline-variant'
              }`}
          >
            <div className={`p-3 ${bg} rounded-lg w-fit mb-4`}>
              <span className={`material-symbols-outlined ${text}`}>{icon}</span>
            </div>
            <div>
              <p className={`text-[11px] font-bold tracking-widest uppercase
                ${alert ? 'text-error/80' : 'text-stone-500'}`}>
                {label}
              </p>
              <h2 className={`text-2xl font-semibold mt-1
                ${alert ? 'text-error' : 'text-on-surface'}`}>
                {value}
              </h2>
              {progress !== undefined && (
                <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="bg-secondary h-full rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-stone-400 mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfica + Top deudores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Gráfica mensual */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl
          border border-outline-variant shadow-sm p-6">
          <h3 className="text-xl font-medium text-primary mb-6">
            Recaudo mensual {year}
          </h3>
          <div className="flex items-end gap-1.5 px-2" style={{ height: 180 }}>
            {metrics.monthlyChart.map(({ month, recaudado, deuda }) => {
              const deudaH     = Math.round((deuda / maxDeuda) * 160);
              const recaudadoH = deuda > 0 ? Math.round((recaudado / maxDeuda) * 160) : 0;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full relative" style={{ height: 160 }}>
                    {deudaH > 0 && (
                      <div
                        className="w-full bg-stone-100 rounded-t-sm absolute bottom-0"
                        style={{ height: deudaH }}
                      />
                    )}
                    {recaudadoH > 0 && (
                      <div
                        className="w-full bg-secondary rounded-t-sm absolute bottom-0 transition-all"
                        style={{ height: recaudadoH }}
                      />
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-stone-400">{month}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-5 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-secondary inline-block" />
              Recaudado
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-stone-100 border border-stone-200 inline-block" />
              Deuda total
            </div>
          </div>
        </div>

        {/* Top deudores */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6">
          <h3 className="text-xl font-medium text-primary mb-4">Top deudores</h3>
          {metrics.topDeudores.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2 text-stone-400">
              <span className="material-symbols-outlined text-4xl text-secondary">
                check_circle
              </span>
              <p className="text-xs font-medium">Sin deudores en {year}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.topDeudores.map((d, i) => {
                const initials = d.nombre
                  .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div key={d.identidad} className="flex items-center gap-3">
                    <span className="text-xs font-black text-stone-300 w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center
                      justify-center flex-shrink-0">
                      <span className="text-[10px] font-black text-red-700">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">
                        {d.nombre}
                      </p>
                      <p className="text-[10px] text-stone-400">{d.grado}</p>
                    </div>
                    <span className="text-xs font-black text-red-600 flex-shrink-0">
                      {fmt(d.saldo)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default DashboardPage;