// src/components/docente/EstudianteNotasPanel.tsx
// Panel derecho: muestra todas las materias del estudiante seleccionado,
// agrupadas por área, con inputs de nota y observación.

import type { MateriaEdit } from '../../hooks/useNotasDocente';

// ── Utilidades ─────────────────────────────────────────────────────────────────

const agruparPorArea = (materias: MateriaEdit[]) => {
  const map = new Map<string, MateriaEdit[]>();
  for (const m of materias) {
    if (!map.has(m.area)) map.set(m.area, []);
    map.get(m.area)!.push(m);
  }
  return Array.from(map.entries()).map(([area, items]) => ({ area, items }));
};

// ── Status indicator ──────────────────────────────────────────────────────────

const StatusDot = ({ m }: { m: MateriaEdit }) => {
  if (m.error)       return <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" title="Error" />;
  if (m.dirty)       return <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" title="Sin guardar" />;
  if (m.nota !== '') return <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" title="Guardado" />;
  return               <span className="w-2 h-2 rounded-full bg-stone-200 flex-shrink-0" title="Sin nota" />;
};

// ── Fila de materia ────────────────────────────────────────────────────────────

interface MateriaRowProps {
  m:         MateriaEdit;
  onNota:    (id: number, val: number | '') => void;
  onObs:     (id: number, val: string) => void;
}

const MateriaRow = ({ m, onNota, onObs }: MateriaRowProps) => {
  const handleNota = (raw: string) => {
    if (raw === '') { onNota(m.id_materia, ''); return; }
    const n = parseFloat(raw);
    onNota(m.id_materia, isNaN(n) ? '' : n);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
      ${m.dirty ? 'bg-orange-50/50' : 'hover:bg-stone-50'}`}>

      {/* Status dot */}
      <StatusDot m={m} />

      {/* Nombre materia */}
      <span className="text-sm font-medium text-on-surface flex-1 truncate">{m.nombre}</span>

      {/* Input nota */}
      <div className="flex flex-col items-end flex-shrink-0">
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={m.nota === '' ? '' : m.nota}
          onChange={(e) => handleNota(e.target.value)}
          placeholder="—"
          className={`w-20 text-center text-sm py-1.5 px-2 rounded-lg border transition-all outline-none
            ${m.error
              ? 'border-error bg-error-container/20 text-error focus:ring-2 focus:ring-error/30'
              : m.dirty
                ? 'border-orange-300 bg-orange-50 focus:ring-2 focus:ring-orange-200'
                : 'border-outline-variant bg-white focus:ring-2 focus:ring-primary/20'
            }`}
        />
        {m.error && (
          <span className="text-[10px] text-error mt-0.5">{m.error}</span>
        )}
      </div>

      {/* Input observación */}
      <input
        type="text"
        value={m.observacion ?? ''}
        onChange={(e) => onObs(m.id_materia, e.target.value)}
        placeholder="Observación…"
        className="w-40 text-xs py-1.5 px-2.5 rounded-lg border border-outline-variant bg-white
          focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all
          placeholder:text-stone-300 flex-shrink-0"
      />
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────────

interface EstudianteNotasPanelProps {
  materias:    MateriaEdit[];
  isLoading:   boolean;
  error:       string;
  onNota:      (id_materia: number, val: number | '') => void;
  onObs:       (id_materia: number, val: string) => void;
}

const EstudianteNotasPanel = ({
  materias, isLoading, error, onNota, onObs,
}: EstudianteNotasPanelProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-stone-400">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
        <span className="text-sm">Cargando materias…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-error-container rounded-xl border border-error/20 m-4">
        <span className="material-symbols-outlined text-error text-xl">error</span>
        <p className="text-sm text-error font-medium">{error}</p>
      </div>
    );
  }

  if (!materias.length) return null;

  const grupos = agruparPorArea(materias);
  const completadas = materias.filter((m) => m.nota !== '').length;

  return (
    <div className="flex flex-col">
      {/* Mini progress */}
      <div className="px-4 py-2 border-b border-stone-100 flex items-center gap-3 bg-stone-50/50">
        <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all"
            style={{ width: `${(completadas / materias.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-stone-500 flex-shrink-0">
          {completadas} / {materias.length} materias
        </span>
      </div>

      {/* Header columnas */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-stone-100">
        <span className="w-2 flex-shrink-0" />
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex-1">Materia</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider w-20 text-center flex-shrink-0">Nota (0–10)</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider w-40 flex-shrink-0">Observación</span>
      </div>

      {/* Grupos por área */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        {grupos.map(({ area, items }) => (
          <div key={area}>
            {/* Encabezado área */}
            <div className="px-4 py-1.5 bg-stone-50 border-y border-stone-100">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                {area}
              </span>
            </div>
            {/* Filas de materias */}
            {items.map((m) => (
              <MateriaRow key={m.id_materia} m={m} onNota={onNota} onObs={onObs} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EstudianteNotasPanel;