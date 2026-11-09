// src/components/ds/PageHeader.tsx
// Encabezado de página: título, fecha de hoy y usuario.
// En el celular muestra el escudo a la izquierda y las iniciales a la derecha;
// las acciones (p. ej. el selector de año) pasan a una fila propia.
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { iniciales } from '../../utils/iniciales';
import { NOMBRE_ROL } from '../../constants/navigation';

interface Props {
  titulo:     string;
  /** Se muestra antes de la fecha: «Resumen académico · lunes, 9 de noviembre». */
  subtitulo?: string;
  acciones?:  ReactNode;
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fechaLarga = () =>
  capitalizar(new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()));
const fechaCorta = () =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

const PageHeader = ({ titulo, subtitulo, acciones }: Props) => {
  const { user } = useAuth();
  const nombre = user?.nombre || user?.username || '';
  const rol    = NOMBRE_ROL[user?.roles[0] ?? ''] ?? '';

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/escudo-128.png" alt="" width={42} height={42}
            className="lg:hidden w-[42px] h-[42px] rounded-full object-cover shrink-0" />
          <div className="flex flex-col min-w-0">
            <h1 className="m-0 text-lg lg:text-[26px] font-semibold tracking-tight text-tinta truncate">{titulo}</h1>
            <span className="text-xs lg:text-[15px] text-tinta-suave">
              {subtitulo && <span className="block lg:inline">{subtitulo}<span className="hidden lg:inline"> · </span></span>}
              <span className="lg:hidden">{fechaCorta()}</span>
              <span className="hidden lg:inline">{subtitulo ? fechaLarga().toLowerCase() : fechaLarga()}</span>
            </span>
          </div>
        </div>
        {/* Celular: solo iniciales */}
        <span title={`${nombre} · ${rol}`} aria-label={`${nombre}, ${rol}`} role="img"
          className="lg:hidden w-11 h-11 rounded-full bg-vino-suave text-vino font-semibold text-[13px]
            flex items-center justify-center shrink-0">
          {iniciales(nombre)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {acciones && <div className="w-full lg:w-auto">{acciones}</div>}
        {/* Escritorio: iniciales + nombre + rol */}
        <div className="hidden lg:flex items-center gap-2.5 min-h-[52px] pl-1.5 pr-[18px] py-1.5 rounded-full bg-tarjeta">
          <span aria-hidden="true"
            className="w-10 h-10 rounded-full bg-vino-suave text-vino font-semibold text-sm flex items-center justify-center">
            {iniciales(nombre)}
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-tinta max-w-[200px] truncate">{nombre}</span>
            <span className="text-xs text-tinta-suave">{rol}</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
