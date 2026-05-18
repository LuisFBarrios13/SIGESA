// src/components/docente/EstudianteNotasPanel.tsx

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

// ── Status dot ────────────────────────────────────────────────────────────────

const StatusDot = ({ m }: { m: MateriaEdit }) => {
  if (m.error)       return <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" title="Error" />;
  if (m.dirty)       return <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" title="Sin guardar" />;
  if (m.nota !== '') return <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" title="Guardado" />;
  return               <span className="w-2 h-2 rounded-full bg-stone-200 flex-shrink-0" title="Sin nota" />;
};

// ── Puesto del periodo ─────────────────────────────────────────────────────────

interface PuestoBarProps {
  puesto:      number | null;
  savedPuesto: number | null;
  onPuesto:    (val: number | null) => void;
}

const PuestoBar = ({ puesto, savedPuesto, onPuesto }: PuestoBarProps) => {
  const isDirty = puesto !== savedPuesto;
  const emoji   = puesto === 1 ? '🥇' : puesto === 2 ? '🥈' : puesto === 3 ? '🥉' : null;

  return (
    <div className={`px-4 py-3 border-b flex items-center gap-3 transition-colors
      ${isDirty ? 'bg-orange-50 border-orange-200' : 'bg-stone-50/60 border-stone-100'}`}>
      <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
        military_tech
      </span>
      <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex-shrink-0">
        Puesto en el periodo
      </span>
      <input
        type="number"
        min={1}
        step={1}
        value={puesto ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') { onPuesto(null); return; }
          const n = parseInt(raw, 10);
          if (!isNaN(n) && n >= 1) onPuesto(n);
        }}
        placeholder="—"
        className={`w-20 text-center text-sm py-1.5 px-2 rounded-lg border transition-all outline-none
          ${isDirty
            ? 'border-orange-300 bg-orange-50 focus:ring-2 focus:ring-orange-200'
            : 'border-outline-variant bg-white focus:ring-2 focus:ring-primary/20'
          }`}
      />
      {emoji && puesto !== null && (
        <span className="text-sm">{emoji} Puesto {puesto}</span>
      )}
      {isDirty && (
        <span className="ml-auto text-[10px] text-orange-600 font-semibold">Sin guardar</span>
      )}
    </div>
  );
};

// ── Fila de materia ────────────────────────────────────────────────────────────

interface MateriaRowProps {
  m:        MateriaEdit;
  onNota:   (id: number, val: number | '') => void;
  onFallas: (id: number, val: number) => void;
  onIH:     (id: number, val: number) => void;
}

/** Input numérico reutilizable para fallas e I.H. (enteros ≥ 0) */
const IntInput = ({
  value, onChange, width = 'w-14', title,
}: {
  value: number;
  onChange: (v: number) => void;
  width?: string;
  title?: string;
}) => (
  <input
    type="number"
    min={0}
    step={1}
    value={value}
    title={title}
    onChange={(e) => {
      const n = parseInt(e.target.value, 10);
      onChange(isNaN(n) ? 0 : Math.max(0, n));
    }}
    className={`${width} text-center text-sm py-1.5 px-1 rounded-lg border
      border-outline-variant bg-white focus:ring-2 focus:ring-primary/20
      focus:outline-none transition-all flex-shrink-0`}
  />
);

const MateriaRow = ({ m, onNota, onFallas, onIH }: MateriaRowProps) => {
  const handleNota = (raw: string) => {
    if (raw === '') { onNota(m.id_materia, ''); return; }
    const n = parseFloat(raw);
    onNota(m.id_materia, isNaN(n) ? '' : n);
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors
      ${m.dirty ? 'bg-orange-50/50' : 'hover:bg-stone-50'}`}>

      <StatusDot m={m} />

      {/* Nombre */}
      <span className="text-sm font-medium text-on-surface flex-1 truncate min-w-0">
        {m.nombre}
      </span>

      {/* I.H. — editable */}
      <IntInput
        value={m.intensidad_horaria}
        onChange={(v) => onIH(m.id_materia, v)}
        width="w-14"
        title="Intensidad horaria semanal"
      />

      {/* Fallas — editable */}
      <IntInput
        value={m.fallas}
        onChange={(v) => onFallas(m.id_materia, v)}
        width="w-14"
        title="Fallas (inasistencias)"
      />

      {/* Nota */}
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
        {m.error && <span className="text-[10px] text-error mt-0.5">{m.error}</span>}
      </div>
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────────

interface EstudianteNotasPanelProps {
  materias:    MateriaEdit[];
  isLoading:   boolean;
  error:       string;
  onNota:      (id_materia: number, val: number | '') => void;
  onFallas:    (id_materia: number, val: number) => void;
  onIH:        (id_materia: number, val: number) => void;
  puesto:      number | null;
  savedPuesto: number | null;
  onPuesto:    (val: number | null) => void;
  observaciones:       string;
  onObservaciones:     (val: string) => void;
}

const EstudianteNotasPanel = ({
  materias, isLoading, error,
  onNota, onFallas, onIH,
  puesto, savedPuesto, onPuesto,
  observaciones, onObservaciones,
}: EstudianteNotasPanelProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-stone-400">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">
          progress_activity
        </span>
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

  const grupos      = agruparPorArea(materias);
  const completadas = materias.filter((m) => m.nota !== '').length;

  return (
    <div className="flex flex-col">

      {/* Puesto — único por periodo */}
      <PuestoBar puesto={puesto} savedPuesto={savedPuesto} onPuesto={onPuesto} />

      {/* Progreso notas */}
      <div className="px-4 py-2 border-b border-stone-100 flex items-center gap-3 bg-stone-50/50">
        <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all"
            style={{ width: `${(completadas / materias.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-stone-500 flex-shrink-0">
          {completadas} / {materias.length} notas
        </span>
      </div>

      {/* Header columnas */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-100 bg-stone-50/30">
        <span className="w-2 flex-shrink-0" />
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex-1">Materia</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider w-14 text-center flex-shrink-0" title="Intensidad Horaria">I.H.</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider w-14 text-center flex-shrink-0">Fallas</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider w-20 text-center flex-shrink-0">Nota (0–10)</span>
      </div>

      {/* Áreas y materias */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 460px)' }}>
        {grupos.map(({ area, items }) => (
          <div key={area}>
            <div className="px-4 py-1.5 bg-stone-50 border-y border-stone-100">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{area}</span>
            </div>
            {items.map((m) => (
              <MateriaRow key={m.id_materia} m={m} onNota={onNota} onFallas={onFallas} onIH={onIH} />
            ))}
          </div>
        ))}
      </div>

      {/* Observaciones generales del periodo */}
      <div className="px-4 py-3 border-t border-stone-200 bg-stone-50/40">
        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
          Observaciones del periodo
        </label>
        <textarea
          value={observaciones}
          onChange={(e) => onObservaciones(e.target.value)}
          placeholder="Observaciones generales del estudiante en este periodo…"
          rows={3}
          className="w-full text-sm py-2 px-3 rounded-lg border border-outline-variant bg-white
            focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none
            placeholder:text-stone-300"
        />
      </div>
    </div>
  );
};

export default EstudianteNotasPanel;