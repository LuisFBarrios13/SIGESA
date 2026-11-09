// src/components/estudiantes/RematricularModal.tsx
// Matricular a un estudiante que ya existe (normalmente para el año siguiente).
import { useState } from 'react';
import type { EstudianteListItem, Grado } from '../../services/api';
import type { JornadaEstudiante } from '../../types/shared';
import { NOMBRES_GRADOS, getMatriculaActiva } from '../../constants/estudiantes';

interface RematricularModalProps {
  estudiante: EstudianteListItem;
  grados:     Grado[];
  isLoading:  boolean;
  error:      string;
  onConfirm:  (datos: { id_grado: number; year: number }) => void;
  onClose:    () => void;
}

const YEAR_ACTUAL = new Date().getFullYear();

/** Valores sugeridos: el año que le falta y el grado siguiente al último cursado. */
const sugerencia = (e: EstudianteListItem, grados: Grado[]) => {
  const ultima = getMatriculaActiva(e.matriculas);
  const tieneEsteYear = e.matriculas.some((m) => m.year === YEAR_ACTUAL);
  const year = tieneEsteYear ? YEAR_ACTUAL + 1 : YEAR_ACTUAL;
  const jornada: JornadaEstudiante = ultima?.grado?.jornada ?? 'MAÑANA';

  let nombre: string | undefined = ultima?.grado?.nombre;
  if (ultima && year > ultima.year) {
    const i = NOMBRES_GRADOS.indexOf(ultima.grado?.nombre as typeof NOMBRES_GRADOS[number]);
    if (i >= 0 && i < NOMBRES_GRADOS.length - 1) nombre = NOMBRES_GRADOS[i + 1];
  }
  const grado = grados.find((g) => g.nombre === nombre && g.jornada === jornada);
  return { year, jornada, id_grado: grado?.id_grado ?? 0 };
};

const RematricularModal = ({ estudiante, grados, isLoading, error, onConfirm, onClose }: RematricularModalProps) => {
  const inicial = sugerencia(estudiante, grados);
  const [year,     setYear]     = useState(inicial.year);
  const [jornada,  setJornada]  = useState<JornadaEstudiante>(inicial.jornada);
  const [idGrado,  setIdGrado]  = useState(inicial.id_grado);

  const gradosJornada = grados.filter((g) => g.jornada === jornada);
  const yaMatriculado = estudiante.matriculas.some((m) => m.year === year);
  const puedeGuardar  = !!idGrado && !yaMatriculado && !isLoading;

  const cambiarJornada = (j: JornadaEstudiante) => {
    setJornada(j);
    // Mismo grado en la otra jornada, si existe
    const actual = grados.find((g) => g.id_grado === idGrado);
    setIdGrado(grados.find((g) => g.jornada === j && g.nombre === actual?.nombre)?.id_grado ?? 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">
        <div className="px-6 pt-6">
          <h3 className="text-lg font-bold text-on-surface">Matricular estudiante</h3>
          <p className="text-sm text-stone-500 mt-0.5">
            {estudiante.nombre} · <span className="font-mono">{estudiante.numero_identidad}</span>
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Año */}
          <label className="block">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Año</span>
            <select value={year} onChange={(ev) => setYear(Number(ev.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-outline-variant bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30">
              {[YEAR_ACTUAL - 1, YEAR_ACTUAL, YEAR_ACTUAL + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {yaMatriculado && (
              <span className="text-xs text-error mt-1 block">Ya tiene una matrícula en {year}.</span>
            )}
          </label>

          {/* Jornada */}
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Jornada</span>
            <div className="mt-1 flex gap-1 bg-stone-100 rounded-xl p-1">
              {(['MAÑANA', 'TARDE'] as const).map((j) => (
                <button key={j} type="button" onClick={() => cambiarJornada(j)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all
                    ${jornada === j ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-on-surface'}`}>
                  {j === 'MAÑANA' ? 'Mañana' : 'Tarde'}
                </button>
              ))}
            </div>
          </div>

          {/* Grado */}
          <label className="block">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Grado</span>
            <select value={idGrado} onChange={(ev) => setIdGrado(Number(ev.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-outline-variant bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value={0} disabled>Selecciona un grado</option>
              {gradosJornada.map((g) => (
                <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>
              ))}
            </select>
          </label>

          <p className="text-xs text-stone-500">
            El acudiente sigue siendo el mismo. Después, en <strong>Pagos</strong>, genera la cuenta de
            matrícula y las pensiones del año.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-error-container rounded-lg border border-error/20">
              <span className="material-symbols-outlined text-error text-lg">error</span>
              <p className="text-xs text-error font-medium">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-2">
          <button onClick={onClose} disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onConfirm({ id_grado: idGrado, year })} disabled={!puedeGuardar}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary
              shadow-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {isLoading && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
            Matricular
          </button>
        </div>
      </div>
    </div>
  );
};

export default RematricularModal;
