// src/components/acudientes/EstadoCuentaCard.tsx
// Porcentaje pagado, progreso de matrícula/pensiones/total y la próxima cuota.
import ProgressBar from '../ds/ProgressBar';
import EstadoBadge from '../ds/EstadoBadge';
import { fmt, fmtCorto, type resumirCuotas } from './cuotas';

interface Props {
  year:     number;
  pct:      number;
  totales:  { deuda: number; pagado: number };
  pension:  number | null;
  resumen:  ReturnType<typeof resumirCuotas>;
}

const porcentaje = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);

const EstadoCuentaCard = ({ year, pct, totales, pension, resumen }: Props) => {
  const { matricula, pensiones, proxima } = resumen;

  return (
    <section className="bg-tarjeta rounded-[22px] md:rounded-[24px] p-[18px] md:p-[26px] flex flex-col gap-5 min-w-0">
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-base md:text-[15px] font-bold md:font-normal text-tinta md:text-tinta-suave">
          Estado de cuenta {year}
        </h2>
        <div className="hidden md:flex items-center gap-3">
          <span className="text-[30px] font-extrabold">{pct}%</span>
          <EstadoBadge tono="verde" tamano="md">pagado</EstadoBadge>
        </div>
        {pension !== null && <span className="hidden md:block text-sm text-tinta-suave">Pensión {fmt(pension)} / mes</span>}
      </div>

      <div className="hidden md:block h-px bg-linea" />

      {matricula.total > 0 && (
        <ProgressBar etiqueta="Matrícula" detalle={`${matricula.pagadas} de ${matricula.total}`}
          valor={porcentaje(matricula.pagadas, matricula.total)} tono="verde" />
      )}
      {pensiones.total > 0 && (
        <ProgressBar etiqueta="Pensiones" detalle={`${pensiones.pagadas} de ${pensiones.total}`}
          valor={porcentaje(pensiones.pagadas, pensiones.total)} tono="vino" />
      )}
      <ProgressBar etiqueta="Total del año" detalle={`${fmtCorto(totales.pagado)} de ${fmtCorto(totales.deuda)}`}
        valor={porcentaje(totales.pagado, totales.deuda)} tono="dorado" />

      <div className="bg-crema-oscuro rounded-2xl p-3.5 md:p-4 flex justify-between items-center gap-3">
        {proxima ? (
          <>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-tinta-suave">
                {proxima.cuenta.estado === 'VENCIDO' ? 'Pago vencido' : 'Próximo pago'}
              </span>
              <span className="text-sm md:text-[15px] font-bold">{proxima.nombre} · {fmt(proxima.saldo)}</span>
            </div>
            <EstadoBadge estado={proxima.cuenta.estado} />
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm font-bold text-verde-texto">
            <span aria-hidden="true" className="material-symbols-outlined text-xl">check_circle</span>
            Todo al día
          </div>
        )}
      </div>
    </section>
  );
};

export default EstadoCuentaCard;
