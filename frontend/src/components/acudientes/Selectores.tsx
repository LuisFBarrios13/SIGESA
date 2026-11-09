// src/components/acudientes/Selectores.tsx
// Selector de año (matrícula) y de estudiante, en forma de píldoras.
import type { EstudianteVinculado, MatriculaResumenAcudiente } from '../../services/acudienteApi';
import { matriculasPorAnio } from './cuotas';

const pildora = (activa: boolean) =>
  `min-h-11 px-[18px] rounded-full text-sm transition-colors whitespace-nowrap ${
    activa ? 'bg-verde text-white font-bold' : 'text-tinta-media font-semibold hover:bg-crema'
  }`;

export const SelectorAnio = ({ matriculas, seleccionada, onSelect }: {
  matriculas:   MatriculaResumenAcudiente[];
  seleccionada: MatriculaResumenAcudiente | null;
  onSelect:     (m: MatriculaResumenAcudiente) => void;
}) => {
  const opciones = matriculasPorAnio(matriculas);
  if (opciones.length <= 1) return null;

  return (
    <div role="group" aria-label="Año escolar"
      className="grid lg:flex gap-1 bg-tarjeta p-1 rounded-full"
      style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}>
      {opciones.map((m) => (
        <button key={m.id_matricula} type="button" onClick={() => onSelect(m)}
          aria-pressed={seleccionada?.year === m.year} className={pildora(seleccionada?.year === m.year)}>
          {m.year}
        </button>
      ))}
    </div>
  );
};

export const SelectorEstudiante = ({ estudiantes, seleccionado, onSelect }: {
  estudiantes:  EstudianteVinculado[];
  seleccionado: EstudianteVinculado | null;
  onSelect:     (e: EstudianteVinculado) => void;
}) => {
  if (estudiantes.length <= 1) return null;

  return (
    <div role="group" aria-label="Estudiante" className="flex flex-wrap gap-2">
      {estudiantes.map((e) => {
        const activo = seleccionado?.numero_identidad === e.numero_identidad;
        return (
          <button key={e.numero_identidad} type="button" onClick={() => onSelect(e)} aria-pressed={activo}
            className={`min-h-11 px-4 rounded-full text-sm max-w-full truncate transition-colors ${
              activo ? 'bg-vino text-white font-bold' : 'bg-tarjeta text-tinta-media font-semibold hover:text-tinta'
            }`}>
            {e.nombre}
          </button>
        );
      })}
    </div>
  );
};
