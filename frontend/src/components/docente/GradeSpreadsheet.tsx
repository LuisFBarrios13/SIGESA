// Single Responsibility: renders the editable grade entry spreadsheet

import Icon from '../ui/Icon';
import type { StudentRow, GradeColumn, StudentGrades } from '../../types/docente';

// ── Grade Input Cell ──────────────────────────────────────────

interface GradeInputCellProps {
  value: number | '';
  onChange: (value: number | '') => void;
}

const GradeInputCell = ({ value, onChange }: GradeInputCellProps) => (
  <td className="p-2 border-l border-stone-200">
    <input
      type="text"
      value={value}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') {
          onChange('');
        } else {
          const num = parseFloat(raw);
          if (!isNaN(num)) onChange(num);
        }
      }}
      className="w-full h-10 px-3 bg-transparent border-none text-center text-sm focus:bg-white focus:ring-1 focus:ring-primary-container rounded transition-all outline-none"
    />
  </td>
);

// ── Final Grade Cell ──────────────────────────────────────────

const FinalGradeCell = ({ grade }: { grade: number | null }) => (
  <td className="p-4 border-l border-stone-200 text-sm font-bold text-center bg-orange-50/20">
    {grade !== null ? (
      <span className="text-secondary">{grade}</span>
    ) : (
      <span className="text-stone-300">—</span>
    )}
  </td>
);

// ── Student Row ───────────────────────────────────────────────

interface StudentRowProps {
  row: StudentRow;
  columns: GradeColumn[];
  onGradeChange: (studentId: string, field: keyof StudentGrades, value: number | '') => void;
}

const GradeStudentRow = ({ row, columns, onGradeChange }: StudentRowProps) => (
  <tr className="hover:bg-stone-50/50 group transition-colors">
    <td className="p-4 text-center text-sm text-stone-400">
      {String(row.index).padStart(2, '0')}
    </td>

    {/* Sticky student name cell */}
    <td className="p-4 sticky left-0 bg-white group-hover:bg-stone-50 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <img
          src={row.avatarUrl}
          alt={`${row.name} photo`}
          className="w-8 h-8 rounded-full bg-stone-100 object-cover"
        />
        <span className="text-sm font-semibold text-on-surface">{row.name}</span>
      </div>
    </td>

    {/* Editable grade columns */}
    {columns.map((col) => (
      <GradeInputCell
        key={col.key}
        value={row.grades[col.key]}
        onChange={(val) => onGradeChange(row.id, col.key, val)}
      />
    ))}

    {/* Computed final grade */}
    <FinalGradeCell grade={row.finalGrade} />

    {/* Overflow action (visible on hover) */}
    <td className="p-4 text-center border-l border-stone-200 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="text-stone-400 hover:text-primary">
        <Icon name="more_vert" className="text-lg" />
      </button>
    </td>
  </tr>
);

// ── Table Header ──────────────────────────────────────────────

const SpreadsheetHeader = ({ columns }: { columns: GradeColumn[] }) => (
  <thead>
    <tr className="bg-stone-100 border-b border-stone-200">
      <th className="p-4 w-12 text-center text-[11px] font-bold text-stone-400">#</th>
      <th className="p-4 min-w-[280px] text-xs font-semibold tracking-widest uppercase text-stone-600 sticky left-0 bg-stone-100 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
        STUDENT NAME
      </th>
      {columns.map((col) => (
        <th
          key={col.key}
          className="p-4 min-w-[120px] text-xs font-semibold tracking-widest uppercase text-stone-600 border-l border-stone-200"
        >
          {col.label}{' '}
          <span className="text-[10px] text-stone-400 font-normal">({col.weight}%)</span>
        </th>
      ))}
      <th className="p-4 min-w-[140px] text-xs font-semibold tracking-widest uppercase text-primary border-l border-stone-200 bg-orange-50/30">
        FINAL GRADE
      </th>
      <th className="p-4 w-20 border-l border-stone-200" />
    </tr>
  </thead>
);

// ── Main Component ────────────────────────────────────────────

interface GradeSpreadsheetProps {
  rows: StudentRow[];
  columns: GradeColumn[];
  onGradeChange: (studentId: string, field: keyof StudentGrades, value: number | '') => void;
}

const GradeSpreadsheet = ({ rows, columns, onGradeChange }: GradeSpreadsheetProps) => (
  <section className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
    <div className="overflow-x-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar-thumb]:bg-outline-variant [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-outline">
      <table className="w-full border-collapse text-left">
        <SpreadsheetHeader columns={columns} />
        <tbody className="divide-y divide-stone-100">
          {rows.map((row) => (
            <GradeStudentRow
              key={row.id}
              row={row}
              columns={columns}
              onGradeChange={onGradeChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default GradeSpreadsheet;