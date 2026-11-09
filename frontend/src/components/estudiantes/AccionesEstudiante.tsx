// src/components/estudiantes/AccionesEstudiante.tsx
// Botones de un estudiante, siempre visibles: editar, acudientes, matricular
// y retirar/reactivar (sobre la matrícula vigente).
import type { EstudianteListItem } from '../../services/api';
import type { MatriculaListItem } from '../../types/matriculas';
import { Icono } from '../ds/Controles';

export interface AccionesEstudianteProps {
  estudiante:         EstudianteListItem;
  vigente?:           MatriculaListItem;
  panelAbierto:       boolean;
  onEditarEstudiante: (e: EstudianteListItem) => void;
  onVerAcudientes:    (id: string, nombre: string) => void;
  onMatricular:       (e: EstudianteListItem) => void;
  onCambiarEstado:    (e: EstudianteListItem, m: MatriculaListItem) => void;
  /** Botones blancos cuando van sobre un fondo crema (tarjetas). */
  sobreCrema?:        boolean;
}

const base = 'w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors';
const fondo = (sobreCrema?: boolean) => (sobreCrema ? 'bg-tarjeta' : 'bg-crema');

const AccionesEstudiante = ({
  estudiante: e, vigente, panelAbierto, onEditarEstudiante, onVerAcudientes, onMatricular, onCambiarEstado, sobreCrema,
}: AccionesEstudianteProps) => {
  const normal = `${base} ${fondo(sobreCrema)} text-tinta-media hover:bg-vino-suave hover:text-vino`;
  const retirar = vigente?.estado === 'ACTIVO';
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onEditarEstudiante(e)} className={normal}
        title="Editar estudiante" aria-label={`Editar a ${e.nombre}`}>
        <Icono nombre="edit" className="text-lg" />
      </button>
      <button type="button" onClick={() => onVerAcudientes(e.numero_identidad, e.nombre)}
        aria-expanded={panelAbierto} title="Ver o editar acudientes" aria-label={`Acudientes de ${e.nombre}`}
        className={panelAbierto ? `${base} bg-verde text-white` : normal}>
        <Icono nombre="family_restroom" className="text-lg" />
      </button>
      <button type="button" onClick={() => onMatricular(e)} className={normal}
        title="Matricular (otro año o grado)" aria-label={`Matricular a ${e.nombre}`}>
        <Icono nombre="how_to_reg" className="text-lg" />
      </button>
      {vigente && vigente.estado !== 'GRADUADO' && (
        <button type="button" onClick={() => onCambiarEstado(e, vigente)}
          title={`${retirar ? 'Retirar' : 'Reactivar'} (${vigente.year})`}
          aria-label={`${retirar ? 'Retirar' : 'Reactivar'} a ${e.nombre} (${vigente.year})`}
          className={`${base} ${fondo(sobreCrema)} text-tinta-media ${retirar ? 'hover:bg-rojo-suave hover:text-rojo' : 'hover:bg-verde-suave hover:text-verde-texto'}`}>
          <Icono nombre={retirar ? 'person_remove' : 'person_check'} className="text-lg" />
        </button>
      )}
    </div>
  );
};

export default AccionesEstudiante;
