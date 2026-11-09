// src/components/estudiantes/StudentRow.tsx
// Fila de la tabla de estudiantes. Muestra la matrícula indicada por la página
// (la del año en curso o la del año filtrado).
import type { EstudianteListItem } from '../../services/api';
import type { MatriculaListItem } from '../../types/matriculas';
import { Avatar } from '../ds/Controles';
import EstadoBadge from '../ds/EstadoBadge';
import AccionesEstudiante, { type AccionesEstudianteProps } from './AccionesEstudiante';
import { fechaCorta } from '../../utils/fechas';

export interface FilaEstudianteProps extends Omit<AccionesEstudianteProps, 'vigente'> {
  matricula?: MatriculaListItem;
  vigente?:   MatriculaListItem;
  posteriores: number[];
}

export const MarcaPosterior = ({ anios }: { anios: number[] }) =>
  anios.length ? (
    <span className="text-xs text-azul-texto" title="También tiene matrícula en">también {anios.join(', ')}</span>
  ) : null;

const StudentRow = ({ matricula, posteriores, ...acciones }: FilaEstudianteProps) => {
  const e: EstudianteListItem = acciones.estudiante;
  return (
    <tr className={`border-b border-linea ${acciones.panelAbierto ? 'bg-crema/60' : ''}`}>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar nombre={e.nombre} />
          <div className="min-w-0">
            <p className="font-semibold text-tinta whitespace-nowrap">{e.nombre}</p>
            <p className="text-xs text-tinta-suave">Doc. {e.numero_identidad}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-tinta-media">{matricula?.grado?.nombre ?? '—'}</td>
      <td className="px-3 py-3">{matricula?.grado?.jornada ? <EstadoBadge estado={matricula.grado.jornada} /> : '—'}</td>
      <td className="px-3 py-3 text-tinta-media">
        <div className="flex flex-col">
          <span>{matricula?.year ?? '—'}</span>
          <MarcaPosterior anios={posteriores} />
        </div>
      </td>
      <td className="hidden xl:table-cell px-3 py-3 text-tinta-media whitespace-nowrap">{fechaCorta(e.fecha_nacimiento)}</td>
      <td className="px-3 py-3">{matricula ? <EstadoBadge estado={matricula.estado} punto /> : '—'}</td>
      <td className="hidden 2xl:table-cell px-3 py-3 text-tinta-media whitespace-nowrap">{fechaCorta(matricula?.fecha_matricula)}</td>
      <td className="px-3 py-3"><AccionesEstudiante {...acciones} /></td>
    </tr>
  );
};

export default StudentRow;
