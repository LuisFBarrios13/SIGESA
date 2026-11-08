// src/components/docente/DisponibilidadGrid.tsx
import type { GradoDisponibilidad, JornadaDocente } from '../../services/api';
import { NOMBRES_GRADOS, type NombreGrado } from '../../constants/docentes';
import JornadaBadge from './JornadaBadge';

interface DisponibilidadGridProps {
  grados: GradoDisponibilidad[];
  gradoSeleccionado: NombreGrado | '';
  jornadaSeleccionada: JornadaDocente | '';
  onSelect: (nombre: NombreGrado) => void;
}
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
    <div className="overflow-x-auto rounded-xl border border-outline-variant">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-200">
            <th className="px-4 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Grado</th>
            <th className="px-4 py-3 text-center text-xs font-bold text-amber-600 uppercase tracking-wider w-44">
              <span className="material-symbols-outlined text-base align-middle mr-1">wb_sunny</span>Mañana
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider w-44">
              <span className="material-symbols-outlined text-base align-middle mr-1">wb_twilight</span>Tarde
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-stone-400 uppercase tracking-wider w-24">Seleccionar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {porNombre.map(({ nombre, manana, tarde }) => {
            const disponible = estaDisponible(nombre);
            const selected   = gradoSeleccionado === nombre;

            const CeldaDocente = ({ g }: { g: GradoDisponibilidad | undefined }) =>
              g?.docente ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-on-surface truncate max-w-[130px]">{g.docente.nombre}</span>
                  <JornadaBadge jornada={g.docente.jornada} />
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-secondary font-medium">
                  <span className="material-symbols-outlined text-base">check_circle</span>Libre
                </span>
              );

            return (
              <tr key={nombre}
                className={`transition-colors ${selected ? 'bg-primary-fixed/10' : disponible ? 'hover:bg-stone-50' : 'opacity-50'}`}>
                <td className="px-4 py-3 font-semibold text-on-surface">{nombre}</td>
                <td className="px-4 py-3 text-center"><CeldaDocente g={manana} /></td>
                <td className="px-4 py-3 text-center"><CeldaDocente g={tarde} /></td>
                <td className="px-4 py-3 text-center">
                  <button type="button" disabled={!disponible} onClick={() => disponible && onSelect(nombre)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                      ${selected    ? 'bg-primary text-white shadow'
                      : disponible ? 'bg-white border border-primary text-primary hover:bg-primary-fixed/20'
                      :              'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
                    {selected ? '✓ Elegido' : disponible ? 'Elegir' : 'Ocupado'}
                  </button>
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
