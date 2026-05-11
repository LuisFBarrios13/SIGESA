// src/components/docente/NotasSpreadsheet.tsx
// Single Responsibility: renders the editable notas table.
// Receives rows from useNotasDocente hook — no own state.

import type { NotaRow } from '../../hooks/useNotasDocente';

interface NotasSpreadsheetProps {
  rows:       NotaRow[];
  onNota:     (id_matricula: number, val: number | '') => void;
  onObs:      (id_matricula: number, val: string) => void;
  isLoading:  boolean;
}

// ── Status dot ─────────────────────────────────────────────────────────────────
const StatusDot = ({ row }: { row: NotaRow }) => {
  if (row.error)       return <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" title="Valor inválido" />;
  if (row.dirty)       return <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" title="Sin guardar" />;
  if (row.nota !== '') return <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" title="Guardado" />;
  return               <span className="w-2 h-2 rounded-full bg-stone-200 flex-shrink-0" title="Sin nota" />;
};

// ── Nota input cell ────────────────────────────────────────────────────────────
interface NotaCellProps {
  row:    NotaRow;
  onNota: (id: number, val: number | '') => void;
}

const NotaCell = ({ row, onNota }: NotaCellProps) => {
  const handleChange = (raw: string) => {
    if (raw === '') { onNota(row.id_matricula, ''); return; }
    const n = parseFloat(raw);
    onNota(row.id_matricula, isNaN(n) ? '' : n);
  };

  return (
    <td className="px-3 py-2.5">
      <input
        type="number"
        min={0}
        max={10}
        step={0.1}
        value={row.nota === '' ? '' : row.nota}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="—"
        className={`w-20 text-center text-sm py-1.5 px-2 rounded-lg border transition-all outline-none
          ${row.error
            ? 'border-error bg-error-container/20 text-error focus:ring-2 focus:ring-error/30'
            : row.dirty
              ? 'border-orange-300 bg-orange-50/50 focus:ring-2 focus:ring-orange-200'
              : 'border-outline-variant bg-stone-50 focus:bg-white focus:ring-2 focus:ring-primary/20'
          }`}
      />
      {row.error && (
        <p className="text-[10px] text-error mt-0.5 leading-tight">{row.error}</p>
      )}
    </td>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const NotasSpreadsheet = ({ rows, onNota, onObs, isLoading }: NotasSpreadsheetProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-stone-400">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
        <span className="text-sm">Cargando notas…</span>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center py-16 gap-3 text-stone-400">
        <span className="material-symbols-outlined text-5xl">manage_search</span>
        <p className="text-sm font-medium">No hay estudiantes matriculados con los filtros seleccionados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-200">
            <th className="px-4 py-3 text-[11px] font-bold text-stone-500 uppercase tracking-wider w-8">#</th>
            <th className="px-4 py-3 text-[11px] font-bold text-stone-500 uppercase tracking-wider">Estudiante</th>
            <th className="px-4 py-3 text-[11px] font-bold text-stone-500 uppercase tracking-wider">Identificación</th>
            <th className="px-4 py-3 text-[11px] font-bold text-primary uppercase tracking-wider w-32">Nota (0–10)</th>
            <th className="px-4 py-3 text-[11px] font-bold text-stone-500 uppercase tracking-wider">Observación</th>
            <th className="px-4 py-3 w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row, idx) => {
            const initials = row.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

            return (
              <tr
                key={row.id_matricula}
                className={`transition-colors ${row.dirty ? 'bg-orange-50/30' : 'hover:bg-stone-50/60'}`}
              >
                {/* Número */}
                <td className="px-4 py-2.5 text-xs text-stone-300 font-bold">
                  {String(idx + 1).padStart(2, '0')}
                </td>

                {/* Nombre */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-black text-on-primary-fixed-variant">{initials}</span>
                    </div>
                    <span className="font-semibold text-on-surface text-sm">{row.nombre}</span>
                  </div>
                </td>

                {/* ID */}
                <td className="px-4 py-2.5 text-xs text-stone-500 font-mono">
                  {row.numero_identidad}
                </td>

                {/* Nota input */}
                <NotaCell row={row} onNota={onNota} />

                {/* Observación */}
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    value={row.observacion}
                    onChange={(e) => onObs(row.id_matricula, e.target.value)}
                    placeholder="Opcional…"
                    className="w-full text-sm py-1.5 px-3 rounded-lg border border-outline-variant bg-stone-50
                      focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all
                      placeholder:text-stone-300"
                  />
                </td>

                {/* Status */}
                <td className="px-4 py-2.5">
                  <StatusDot row={row} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default NotasSpreadsheet;