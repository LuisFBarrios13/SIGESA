// src/components/estudiantes/StudentCard.tsx
// Tarjeta de estudiante (vista de tarjetas y celular). Los acudientes se
// despliegan dentro de la misma tarjeta.
import type { ReactNode } from 'react';
import { Avatar } from '../ds/Controles';
import EstadoBadge from '../ds/EstadoBadge';
import AccionesEstudiante from './AccionesEstudiante';
import { MarcaPosterior, type FilaEstudianteProps } from './StudentRow';
import { fechaCorta } from '../../utils/fechas';

const StudentCard = ({ matricula, posteriores, panel, ...acciones }: FilaEstudianteProps & { panel?: ReactNode }) => {
  const e = acciones.estudiante;
  return (
    <article className={`bg-crema rounded-[20px] p-4 sm:p-5 flex flex-col gap-3.5 min-w-0
      ${acciones.panelAbierto ? 'sm:col-span-2 xl:col-span-3' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar nombre={e.nombre} tamano={44} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-tinta break-words">{e.nombre}</p>
          <p className="text-xs text-tinta-suave">Doc. {e.numero_identidad}</p>
        </div>
        {matricula && <EstadoBadge estado={matricula.estado} punto />}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-tinta-media">
        <span>{matricula?.grado?.nombre ?? 'Sin matrícula'}</span>
        {matricula?.grado?.jornada && <EstadoBadge estado={matricula.grado.jornada} />}
        {matricula && <span className="text-tinta-suave">· {matricula.year}</span>}
        <MarcaPosterior anios={posteriores} />
      </div>
      <p className="text-xs text-tinta-suave">
        Nació el {fechaCorta(e.fecha_nacimiento)}
        {matricula && <> · Matriculado el {fechaCorta(matricula.fecha_matricula)}</>}
      </p>

      <div className="pt-3 border-t border-[#E9E2DC]"><AccionesEstudiante {...acciones} sobreCrema /></div>
      {acciones.panelAbierto && panel}
    </article>
  );
};

export default StudentCard;
