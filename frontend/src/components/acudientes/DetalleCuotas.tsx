// src/components/acudientes/DetalleCuotas.tsx
// Tabla (lista en el celular) de las cuotas del año, con los pagos de cada una.
import DataTable, { type Columna } from '../ds/DataTable';
import EstadoBadge from '../ds/EstadoBadge';
import { fmt, type Cuota } from './cuotas';

const COLUMNAS: Columna<Cuota>[] = [
  { id: 'concepto', titulo: 'Concepto', movil: 'subtitulo', destacar: true,
    celda: (c) => (c.esMatricula ? 'Matrícula' : 'Pensión') },
  { id: 'periodo',  titulo: 'Periodo',  movil: 'titulo',
    celda: (c) => (c.esMatricula ? String(c.cuenta.year) : `${c.nombre} ${c.cuenta.year}`),
    texto: (c) => c.nombre },
  { id: 'valor',    titulo: 'Valor',    movil: 'subtitulo', alinear: 'derecha', celda: (c) => fmt(c.valor) },
  { id: 'saldo',    titulo: 'Saldo',    alinear: 'derecha', celda: (c) => fmt(c.saldo) },
  { id: 'estado',   titulo: 'Estado',   movil: 'extremo',   celda: (c) => <EstadoBadge estado={c.cuenta.estado} /> },
];

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

const PagosDeCuota = ({ cuota }: { cuota: Cuota }) => (
  <div className="bg-crema-oscuro rounded-2xl p-3 flex flex-col gap-2">
    <p className="text-xs font-semibold text-tinta-suave">Pagos realizados</p>
    <ul className="flex flex-col gap-1.5">
      {cuota.cuenta.pagos.map((p) => (
        <li key={p.id_pago} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm bg-tarjeta rounded-xl px-3 py-2">
          <span className="text-tinta-media">
            {fecha(p.fecha_pago)} · <span className="text-tinta-suave">{p.metodo.nombre.toLowerCase()}</span>
          </span>
          <span className="font-bold text-verde-texto tabular-nums">{fmt(Number(p.monto_pago))}</span>
        </li>
      ))}
    </ul>
  </div>
);

const DetalleCuotas = ({ cuotas, year }: { cuotas: Cuota[]; year: number }) => (
  <section className="bg-tarjeta rounded-[22px] md:rounded-[24px] px-[18px] pt-[18px] pb-1.5 md:px-[26px] md:pt-[26px] md:pb-2.5 flex flex-col gap-3 md:gap-4">
    <div className="flex flex-wrap justify-between items-center gap-3">
      <h2 className="m-0 text-base md:text-xl font-bold">Detalle de cuotas</h2>
      <span className="hidden md:inline-block px-[18px] py-2.5 rounded-full bg-vino-suave text-vino text-sm font-semibold">
        Año {year}
      </span>
    </div>
    <DataTable
      columnas={COLUMNAS}
      filas={cuotas}
      claveFila={(c) => c.cuenta.id_cuenta}
      descripcion={`Cuotas del año ${year}`}
      detalle={(c) => (c.cuenta.pagos.length ? <PagosDeCuota cuota={c} /> : null)}
      etiquetaDetalle={(c) => `Ver pagos de ${c.nombre}`}
      vacio={
        <div className="py-12 flex flex-col items-center gap-2 text-center text-tinta-suave">
          <span aria-hidden="true" className="material-symbols-outlined text-5xl">receipt_long</span>
          <p className="text-sm font-semibold text-tinta">Aún no hay cuotas generadas</p>
          <p className="text-xs">El colegio las generará cuando corresponda.</p>
        </div>
      }
    />
  </section>
);

export default DetalleCuotas;
