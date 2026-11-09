// src/components/docente/DisponibilidadGrid.tsx
// Qué grados tienen director en cada jornada, y elegir uno libre para el docente.
import type { GradoDisponibilidad, JornadaDocente } from '../../services/api';
import { NOMBRES_GRADOS, type NombreGrado } from '../../constants/docentes';
import { Icono } from '../ds/Controles';

interface DisponibilidadGridProps {
  grados: GradoDisponibilidad[];
  gradoSeleccionado: NombreGrado | '';
  jornadaSeleccionada: JornadaDocente | '';
  onSelect: (nombre: NombreGrado) => void;
}

const CeldaDocente = ({ g }: { g: GradoDisponibilidad | undefined }) =>
  g?.docente ? (
    <span className="text-[13px] font-semibold text-tinta break-words">{g.docente.nombre}</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[13px] font-medium text-verde-texto">
      <Icono nombre="check_circle" className="text-base" />Libre
    </span>
  );

const DisponibilidadGrid = ({
  grados, gradoSeleccionado, jornadaSeleccionada, onSelect,
}: DisponibilidadGridProps) => {
  const porNombre = NOMBRES_GRADOS.map((nombre) => {
    const manana = grados.find((g) => g.nombre === nombre && g.jornada === 'MAÑANA');
    const tarde  = grados.find((g) => g.nombre === nombre && g.jornada === 'TARDE');
    return { nombre, manana, tarde };
  });

  const estaDisponible = (nombre: NombreGrado): boolean => {
    if (!jornadaSeleccionada) return true;
    const item = porNombre.find((g) => g.nombre === nombre)!;
    if (jornadaSeleccionada === 'COMPLETA') return !item.manana?.docente && !item.tarde?.docente;
    const fila = jornadaSeleccionada === 'MAÑANA' ? item.manana : item.tarde;
    const filaOpuesta = jornadaSeleccionada === 'MAÑANA' ? item.tarde : item.manana;
    if (fila?.docente) return false;
    if (filaOpuesta?.docente?.jornada === 'COMPLETA') return false;
    return true;
  };

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <caption className="sr-only">Directores de grupo por grado y jornada</caption>
        <thead>
          <tr className="bg-crema text-left">
            <th scope="col" className="px-3 py-3 font-semibold text-tinta rounded-l-xl">Grado</th>
            <th scope="col" className="px-3 py-3 font-semibold text-tinta">Mañana</th>
            <th scope="col" className="px-3 py-3 font-semibold text-tinta">Tarde</th>
            <th scope="col" className="px-3 py-3 rounded-r-xl"><span className="sr-only">Elegir</span></th>
          </tr>
        </thead>
        <tbody>
          {porNombre.map(({ nombre, manana, tarde }) => {
            const disponible = estaDisponible(nombre);
            const elegido    = gradoSeleccionado === nombre;
            return (
              <tr key={nombre} className={`border-b border-linea ${elegido ? 'bg-vino-suave/50' : ''}`}>
                <td className="px-3 py-2.5 font-semibold text-tinta whitespace-nowrap">{nombre}</td>
                <td className="px-3 py-2.5"><CeldaDocente g={manana} /></td>
                <td className="px-3 py-2.5"><CeldaDocente g={tarde} /></td>
                <td className="px-3 py-2.5 text-right">
                  {disponible ? (
                    <button type="button" onClick={() => onSelect(nombre)} aria-pressed={elegido}
                      aria-label={`${elegido ? 'Elegido' : 'Elegir'}: ${nombre}`}
                      className={`min-h-9 px-3.5 rounded-xl text-[13px] font-semibold transition-colors
                        ${elegido ? 'bg-vino text-white' : 'bg-crema text-vino hover:bg-vino-suave'}`}>
                      {elegido ? 'Elegido' : 'Elegir'}
                    </button>
                  ) : (
                    <span className="text-[13px] text-tinta-suave">Ocupado</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DisponibilidadGrid;
