// src/components/ds/ProgressBar.tsx
// Barra de progreso con etiqueta y detalle opcionales.
import { TONO_BARRA, type Tono } from './tonos';

interface Props {
  /** 0 a 100 (se recorta a ese rango). */
  valor:     number;
  etiqueta?: string;
  /** Texto a la derecha, p. ej. "4 de 10". */
  detalle?:  string;
  tono?:     Tono;
}

const ProgressBar = ({ valor, etiqueta, detalle, tono = 'verde' }: Props) => {
  const pct = Math.max(0, Math.min(100, Math.round(valor)));

  return (
    <div className="flex flex-col gap-2">
      {(etiqueta || detalle) && (
        <div className="flex justify-between gap-3 text-sm">
          {etiqueta && <span className="font-semibold text-tinta">{etiqueta}</span>}
          {detalle && <span className="text-tinta-suave text-right">{detalle}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={etiqueta}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 rounded-full bg-linea overflow-hidden"
      >
        <div className={`h-full rounded-full transition-[width] duration-500 ${TONO_BARRA[tono]}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
