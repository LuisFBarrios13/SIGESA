// src/components/docente/DocenteCard.tsx
// Tarjeta de un docente: jornada, grados a cargo, contacto y acciones.
import type { DocenteListItem } from '../../services/api';
import JornadaBadge from './JornadaBadge';
import { Avatar, Icono } from '../ds/Controles';
import type { Tono } from '../ds/tonos';

interface DocenteCardProps {
  docente:   DocenteListItem;
  indice?:   number;
  onEditar:  (d: DocenteListItem) => void;
  onRestablecerClave: (d: DocenteListItem) => void;
}

const TONOS: Tono[] = ['vino', 'verde', 'dorado', 'azul'];
const boton = 'flex-1 inline-flex items-center justify-center gap-1.5 min-h-10 rounded-xl bg-crema text-tinta-media text-[13px] font-semibold hover:bg-vino-suave hover:text-vino transition-colors';

const DocenteCard = ({ docente, indice = 0, onEditar, onRestablecerClave }: DocenteCardProps) => (
  <article className="bg-tarjeta rounded-[22px] p-[18px] sm:p-5 flex flex-col gap-3.5 min-w-0">
    <div className="flex items-center gap-3">
      <Avatar nombre={docente.nombre} tono={TONOS[indice % TONOS.length]} tamano={48} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-tinta break-words">{docente.nombre}</p>
        <p className="text-xs text-tinta-suave">CC {docente.cedula}</p>
      </div>
      <JornadaBadge jornada={docente.jornada} />
    </div>

    {docente.grados.length > 0 && (
      <ul className="flex flex-wrap gap-1.5">
        {docente.grados.map((g) => (
          <li key={g.id_grado} className="inline-flex items-center gap-1 rounded-[10px] bg-crema px-2.5 py-1 text-xs font-semibold text-tinta-media">
            <Icono nombre="school" className="text-[14px] text-verde" />
            {g.nombre} – {g.jornada === 'MAÑANA' ? 'M' : 'T'}
          </li>
        ))}
      </ul>
    )}

    {(docente.telefono || docente.correo) && (
      <div className="flex flex-col gap-1 text-[13px] text-tinta-media">
        {docente.telefono && <span className="flex items-center gap-1.5"><Icono nombre="phone" className="text-[15px] text-tinta-suave" />{docente.telefono}</span>}
        {docente.correo && <span className="flex items-center gap-1.5 break-all"><Icono nombre="mail" className="text-[15px] text-tinta-suave" />{docente.correo}</span>}
      </div>
    )}

    <div className="flex gap-2 pt-3 border-t border-linea mt-auto">
      <button type="button" onClick={() => onEditar(docente)} className={boton} aria-label={`Editar a ${docente.nombre}`}>
        <Icono nombre="edit" className="text-[17px]" />Editar
      </button>
      <button type="button" onClick={() => onRestablecerClave(docente)} className={boton}
        aria-label={`Restablecer la contraseña de ${docente.nombre}`}>
        <Icono nombre="key" className="text-[17px]" />Contraseña
      </button>
    </div>
  </article>
);

export default DocenteCard;
