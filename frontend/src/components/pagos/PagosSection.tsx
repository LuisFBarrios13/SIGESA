// src/components/pagos/PagosSection.tsx
// Cuenta del estudiante elegido: acciones (generar cuentas), filtro por estado,
// lista de cuotas y, al lado, el estado de cuenta del año.
import { useRef, useState } from 'react';
import CuentaCard from './CuentaCard';
import { ESTADO_META, fmt } from './pagos.constants';
import type { ResumenPagos, CuentaCobro, Tarifa, EstadoCuenta } from '../../services/pagosApi';
import Tarjeta from '../ds/Tarjeta';
import ProgressBar from '../ds/ProgressBar';
import EstadoBadge from '../ds/EstadoBadge';
import { Avatar, Boton, Icono } from '../ds/Controles';
import { Aviso, Mensaje } from '../ds/Estados';

interface PagosSectionProps {
  resumen:          ResumenPagos;
  cuentasFiltradas: CuentaCobro[];
  estadoFilter:     'TODOS' | EstadoCuenta;
  setEstadoFilter:  (v: 'TODOS' | EstadoCuenta) => void;
  onPagar:          (c: CuentaCobro) => void;
  onPension:        () => void;
  onMatricula:      () => void;
  onVolver:         () => void;
  year:             number;
  opLoading:        boolean;
  opError:          string;
  tarifa:           Tarifa | null;
  onEditTarifa:     () => void;
}

const FILTROS = ['TODOS', 'PENDIENTE', 'PAGADO', 'VENCIDO'] as const;

const PagosSection = ({
  resumen, cuentasFiltradas, estadoFilter, setEstadoFilter,
  onPagar, onPension, onMatricula, onVolver, year,
  opLoading, opError, tarifa, onEditTarifa,
}: PagosSectionProps) => {
  const { matricula, totales, cuentas } = resumen;

  // Al filtrar, la lista puede quedar mucho más corta y el navegador sube la
  // página. Se conserva la altura máxima que tuvo la lista para que no salte.
  const listaRef = useRef<HTMLDivElement>(null);
  const [alturaMin, setAlturaMin] = useState(0);
  const cambiarFiltro = (f: 'TODOS' | EstadoCuenta) => {
    setAlturaMin((h) => Math.max(h, listaRef.current?.offsetHeight ?? 0));
    setEstadoFilter(f);
  };

  const tieneMatricula = cuentas.some((c) => c.concepto.nombre === 'MATRÍCULA');
  const tienePension   = cuentas.some((c) => c.concepto.nombre === 'PENSIÓN');
  const pct = totales.deuda > 0 ? Math.round((totales.pagado / totales.deuda) * 100) : 0;
  const primerNombre = matricula.estudiante.nombre.split(' ')[0];

  // Matrícula primero y luego pensiones por mes
  const ordenadas = [...cuentasFiltradas].sort((a, b) =>
    Number(b.concepto.nombre === 'MATRÍCULA') - Number(a.concepto.nombre === 'MATRÍCULA') || a.mes - b.mes);

  const acciones = (
    <>
      {!tarifa && (
        <Boton icono="warning" variante="suave" onClick={onEditTarifa}>Configurar tarifas {year}</Boton>
      )}
      {!tieneMatricula && tarifa && (
        <Boton icono={opLoading ? 'progress_activity' : 'how_to_reg'} variante="suave" onClick={onMatricula} disabled={opLoading}>
          Crear matrícula · {fmt(tarifa.valor_matricula)}
        </Boton>
      )}
      {!tienePension && tarifa && (
        <Boton icono={opLoading ? 'progress_activity' : 'playlist_add'} variante="vino" onClick={onPension} disabled={opLoading}>
          Generar pensiones · {fmt(tarifa.valor_pension)}/mes
        </Boton>
      )}
    </>
  );

  return (
    <>
      {/* Estudiante elegido */}
      <section aria-label="Estudiante seleccionado"
        className="flex flex-wrap items-center gap-3 rounded-[22px] bg-vino-suave px-4 py-3.5">
        <Avatar nombre={matricula.estudiante.nombre} tamano={44} tono="neutro" />
        <div className="flex-1 min-w-[180px] flex flex-col">
          <span className="text-[15px] font-semibold text-tinta break-words">{matricula.estudiante.nombre}</span>
          <span className="text-[13px] text-tinta-media">
            Doc. {matricula.estudiante.numero_identidad} · {matricula.grado.nombre} · {matricula.grado.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'} · {year}
          </span>
        </div>
        <Boton icono="arrow_back" onClick={onVolver}>Cambiar estudiante</Boton>
      </section>

      {opError && <Mensaje tipo="error">{opError}</Mensaje>}

      <div className="flex flex-wrap items-start gap-5">
        <Tarjeta titulo={`Cuenta ${year} · ${primerNombre}`} subtitulo={`${cuentas.length} cuota${cuentas.length !== 1 ? 's' : ''}`}
          acciones={acciones} className="flex-[999_1_520px]">

          {cuentas.length > 0 && (
            <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap items-center gap-2">
              {FILTROS.map((f) => {
                const activo = estadoFilter === f;
                const n = f === 'TODOS' ? cuentas.length : cuentas.filter((c) => c.estado === f).length;
                return (
                  <button key={f} type="button" onClick={() => cambiarFiltro(f)} aria-pressed={activo}
                    className={`inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-full text-[13px] font-semibold transition-colors
                      ${activo ? 'bg-tinta text-white' : 'bg-crema text-tinta-media hover:bg-linea'}`}>
                    {f === 'TODOS' ? 'Todas' : ESTADO_META[f].label}
                    <span className={`px-1.5 rounded-full text-[11px] ${activo ? 'bg-white/20' : 'bg-tarjeta'}`}>{n}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div ref={listaRef} style={{ minHeight: alturaMin || undefined }}>
            {cuentas.length === 0 ? (
              <Aviso enTarjeta={false} icono="receipt_long" titulo="Aún no hay cuentas de cobro"
                texto={tarifa
                  ? 'Usa los botones de arriba para crear la matrícula o generar las pensiones.'
                  : `Configura las tarifas de ${year} para poder generar cuentas.`} />
            ) : ordenadas.length === 0 ? (
              <Aviso enTarjeta={false} icono="filter_alt_off" titulo="No hay cuotas con ese estado" />
            ) : (
              <ul className="flex flex-col gap-2">
                {ordenadas.map((c) => <CuentaCard key={c.id_cuenta} cuenta={c} onPagar={onPagar} />)}
              </ul>
            )}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Estado de cuenta" className="flex-[1_1_300px] lg:sticky lg:top-[3.25rem]">
          <div className="flex items-center gap-3">
            <span className="text-[30px] font-semibold">{pct}%</span>
            <EstadoBadge tono="verde">pagado</EstadoBadge>
          </div>
          <ProgressBar valor={pct} tono="verde" />
          <div className="flex justify-between text-sm"><span className="text-tinta-suave">Total del año</span><span className="font-semibold tabular-nums">{fmt(totales.deuda)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-tinta-suave">Pagado</span><span className="font-semibold tabular-nums">{fmt(totales.pagado)}</span></div>
          <div className={`flex justify-between gap-3 rounded-[14px] px-4 py-3 text-[15px]
            ${totales.pendiente > 0 ? 'bg-dorado-suave text-dorado-texto' : 'bg-verde-suave text-verde-texto'}`}>
            <span className="font-semibold flex items-center gap-1.5">
              {totales.pendiente === 0 && <Icono nombre="check_circle" className="text-lg" />}
              {totales.pendiente > 0 ? 'Saldo pendiente' : 'Al día'}
            </span>
            <span className="font-semibold tabular-nums">{fmt(totales.pendiente)}</span>
          </div>
        </Tarjeta>
      </div>
    </>
  );
};

export default PagosSection;
