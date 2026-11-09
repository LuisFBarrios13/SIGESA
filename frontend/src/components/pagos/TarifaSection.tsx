// src/components/pagos/TarifaSection.tsx
// Banner con las tarifas del año (pensión y matrícula) y el botón para editarlas.
// El año se elige en el encabezado de la página.
import { fmt } from './pagos.constants';
import type { Tarifa } from '../../services/pagosApi';
import { Icono } from '../ds/Controles';

interface TarifaSectionProps {
  tarifa:    Tarifa | null;
  year:      number;
  isLoading: boolean;
  onEdit:    () => void;
}

const Valor = ({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle: string }) => (
  <div className="flex flex-col gap-0.5 rounded-[18px] bg-white/15 px-[18px] py-3.5 flex-[1_1_160px] min-w-0">
    <span className="text-[13px] text-[#FBEFE6]">{etiqueta}</span>
    <span className="text-[22px] sm:text-[26px] font-semibold tabular-nums">{valor}</span>
    <span className="text-xs text-[#FBEFE6]">{detalle}</span>
  </div>
);

const TarifaSection = ({ tarifa, year, isLoading, onEdit }: TarifaSectionProps) => (
  <section aria-label={`Tarifas ${year}`}
    className="relative overflow-hidden rounded-[24px] sm:rounded-card-lg bg-hero text-white p-[22px] sm:px-8 sm:py-7
      flex flex-wrap items-center gap-4 sm:gap-5">
    <div className="flex flex-col gap-1 flex-[1_1_220px] min-w-0">
      <span className="text-sm text-[#FBEFE6]">Tarifas {year}</span>
      <span className="text-lg sm:text-[22px] font-semibold leading-tight">
        {tarifa || isLoading ? 'Valores para todos los estudiantes' : `Sin tarifas configuradas para ${year}`}
      </span>
      {!tarifa && !isLoading && (
        <span className="text-sm text-[#FBEFE6]">Configúralas antes de generar cuentas de cobro.</span>
      )}
    </div>

    {isLoading && (
      <p role="status" className="flex items-center gap-2 text-sm text-[#FBEFE6]">
        <Icono nombre="progress_activity" className="animate-spin text-xl" />Cargando tarifas…
      </p>
    )}

    {tarifa && (
      <>
        <Valor etiqueta="Pensión mensual" valor={fmt(tarifa.valor_pension)}
          detalle={`× 10 meses = ${fmt(Number(tarifa.valor_pension) * 10)}`} />
        <Valor etiqueta="Matrícula" valor={fmt(tarifa.valor_matricula)} detalle="Pago único al inicio" />
      </>
    )}

    {!isLoading && (
      <button type="button" onClick={onEdit}
        className="inline-flex items-center gap-2 min-h-11 px-4 rounded-[14px] bg-white text-tinta text-sm font-semibold hover:bg-white/90">
        <Icono nombre={tarifa ? 'edit' : 'add'} className="text-[19px]" />
        {tarifa ? 'Editar tarifas' : `Configurar tarifas ${year}`}
      </button>
    )}
  </section>
);

export default TarifaSection;
