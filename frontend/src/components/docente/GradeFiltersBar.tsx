// Single Responsibility: renders the period/course filters and action buttons

import Icon from '../ui/Icon';
import type { Period, CourseOption } from '../../types/docente';
import { PERIODS } from '../../constants/docente';

// ── Floating Label Select ─────────────────────────────────────

interface FloatingSelectProps {
  label: string;
  value: string;
  options: string[] | CourseOption[];
  onChange: (value: string) => void;
  minWidth?: string;
}

const FloatingSelect = ({
  label,
  value,
  options,
  onChange,
  minWidth = '160px',
}: FloatingSelectProps) => (
  <div className="relative">
    <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-stone-400 tracking-wider z-10">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ minWidth }}
      className="bg-white border border-stone-200 rounded px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none appearance-none"
    >
      {options.map((opt) =>
        typeof opt === 'string' ? (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ) : (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ),
      )}
    </select>
    <Icon
      name="expand_more"
      className="absolute right-3 top-2.5 text-stone-400 pointer-events-none text-base"
    />
  </div>
);

// ── Main Component ────────────────────────────────────────────

interface GradeFiltersBarProps {
  selectedPeriod: Period;
  selectedCourseId: string;
  courseOptions: CourseOption[];
  onPeriodChange: (period: Period) => void;
  onCourseChange: (courseId: string) => void;
  onExportTemplate: () => void;
  onSaveChanges: () => void;
}

const GradeFiltersBar = ({
  selectedPeriod,
  selectedCourseId,
  courseOptions,
  onPeriodChange,
  onCourseChange,
  onExportTemplate,
  onSaveChanges,
}: GradeFiltersBarProps) => (
  <section className="flex flex-wrap items-center justify-between gap-4">
    {/* Left: Filters */}
    <div className="flex items-center gap-3">
      <FloatingSelect
        label="PERIOD"
        value={selectedPeriod}
        options={[...PERIODS]}
        onChange={(v) => onPeriodChange(v as Period)}
      />
      <FloatingSelect
        label="SUBJECT"
        value={selectedCourseId}
        options={courseOptions}
        onChange={onCourseChange}
        minWidth="200px"
      />
      <button className="flex items-center gap-2 text-stone-500 hover:text-primary transition-colors px-4 py-2">
        <Icon name="tune" className="text-xl" />
        <span className="text-sm font-medium">Advanced Filters</span>
      </button>
    </div>

    {/* Right: Actions */}
    <div className="flex items-center gap-3">
      <button
        onClick={onExportTemplate}
        className="flex items-center gap-2 border border-stone-200 bg-white px-5 py-2.5 rounded text-sm font-medium hover:bg-stone-50 transition-all text-on-surface active:scale-95"
      >
        <Icon name="download" className="text-lg" />
        <span>Export Template</span>
      </button>
      <button
        onClick={onSaveChanges}
        className="flex items-center gap-2 bg-[#20ac68] text-white px-6 py-2.5 rounded text-sm font-bold shadow-md hover:brightness-110 transition-all active:scale-95"
      >
        <Icon name="save" className="text-lg" />
        <span>Save Changes</span>
      </button>
    </div>
  </section>
);

export default GradeFiltersBar;