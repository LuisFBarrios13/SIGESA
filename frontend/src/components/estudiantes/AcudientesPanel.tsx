// src/components/estudiantes/AcudientesPanel.tsx
// Acudientes del estudiante abierto: lista con editar y restablecer contraseña.
// AcudientesLista va dentro de una tarjeta; AcudientesPanel es la fila de tabla.
import type { AcudienteDetalle } from '../../types/acudientes-admin';
import { Avatar, Icono } from '../ds/Controles';
import EstadoBadge from '../ds/EstadoBadge';

interface ListaProps {
  acudientes: AcudienteDetalle[];
  isLoading:  boolean;
  error:      string;
  onEditar:   (a: AcudienteDetalle) => void;
  onRestablecerClave: (a: AcudienteDetalle) => void;
}

const botonIcono = 'w-10 h-10 shrink-0 rounded-xl bg-crema text-tinta-media flex items-center justify-center hover:bg-vino-suave hover:text-vino transition-colors';

export const AcudientesLista = ({ acudientes, isLoading, error, onEditar, onRestablecerClave }: ListaProps) => (
  <div className="rounded-2xl bg-crema p-3.5 flex flex-col gap-2.5">
    {isLoading && (
      <p role="status" className="flex items-center gap-2 text-sm text-tinta-suave">
        <Icono nombre="progress_activity" className="animate-spin text-vino text-lg" />Cargando acudientes…
      </p>
    )}
    {error && <p role="alert" className="text-sm font-medium text-rojo">{error}</p>}
    {!isLoading && !error && acudientes.length === 0 && (
      <p className="text-sm text-tinta-suave">Sin acudientes registrados.</p>
    )}
    {!isLoading && acudientes.length > 0 && (
      <>
        <p className="text-xs font-semibold text-tinta-suave">Acudiente{acudientes.length !== 1 ? 's' : ''}</p>
        <ul className="flex flex-col gap-2">
          {acudientes.map((a) => (
            <li key={a.cedula} className="bg-tarjeta rounded-xl p-3 flex flex-wrap sm:flex-nowrap items-center gap-3">
              <Avatar nombre={a.nombre} tono="verde" />
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-1">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-tinta break-words">{a.nombre}</p>
                  <p className="text-xs text-tinta-suave">CC {a.cedula}</p>
                </div>
                <div className="text-xs text-tinta-media flex flex-col gap-0.5 min-w-0">
                  {a.telefono && <span className="flex items-center gap-1"><Icono nombre="phone" className="text-[14px] text-tinta-suave" />{a.telefono}</span>}
                  {a.correo && <span className="flex items-center gap-1 break-all"><Icono nombre="mail" className="text-[14px] text-tinta-suave" />{a.correo}</span>}
                </div>
                <div className="text-xs text-tinta-media flex flex-wrap items-center gap-1.5">
                  {a.RelacionEA?.parentesco && <span>{a.RelacionEA.parentesco}</span>}
                  {a.RelacionEA?.acudiente_principal && <EstadoBadge tono="verde">Principal</EstadoBadge>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <button type="button" onClick={() => onRestablecerClave(a)} className={botonIcono}
                  title="Restablecer contraseña" aria-label={`Restablecer la contraseña de ${a.nombre}`}>
                  <Icono nombre="key" className="text-lg" />
                </button>
                <button type="button" onClick={() => onEditar(a)} className={botonIcono}
                  title="Editar acudiente" aria-label={`Editar a ${a.nombre}`}>
                  <Icono nombre="edit" className="text-lg" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </>
    )}
  </div>
);

/** La lista como fila de la tabla de estudiantes. */
const AcudientesPanel = ({ colSpan, ...props }: ListaProps & { colSpan: number }) => (
  <tr className="border-b border-linea">
    <td colSpan={colSpan} className="px-4 pb-4"><AcudientesLista {...props} /></td>
  </tr>
);

export default AcudientesPanel;
