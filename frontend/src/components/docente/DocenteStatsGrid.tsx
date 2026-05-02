// Single Responsibility: renders the bottom contextual stats bento grid

import Icon from '../ui/Icon';
import type { GradingProgressStat, DeadlineStat } from '../../types/docente';

// ── Grading Progress Card ─────────────────────────────────────

const GradingProgressCard = ({ stat }: { stat: GradingProgressStat }) => (
  <div className="md:col-span-1 bg-white p-6 border border-stone-200 rounded-xl shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-orange-100 rounded text-primary">
        <Icon name="trending_up" />
      </div>
      <span className="text-[12px] font-semibold tracking-widest uppercase text-stone-500">
        GRADING PROGRESS
      </span>
    </div>
    <div className="flex items-end justify-between">
      <span className="text-4xl font-semibold text-on-surface">{stat.percentage}%</span>
      <span className="text-[11px] text-secondary font-bold mb-2">{stat.deltaLabel}</span>
    </div>
    <div className="w-full bg-stone-100 h-2 rounded-full mt-4 overflow-hidden">
      <div
        className="bg-secondary h-full rounded-full transition-all"
        style={{ width: `${stat.percentage}%` }}
      />
    </div>
  </div>
);

// ── Deadline Card ─────────────────────────────────────────────

const DeadlineCard = ({ stat }: { stat: DeadlineStat }) => (
  <div className="md:col-span-1 bg-white p-6 border border-stone-200 rounded-xl shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-emerald-100 rounded text-secondary">
        <Icon name="event_note" />
      </div>
      <span className="text-[12px] font-semibold tracking-widest uppercase text-stone-500">
        SUBMISSION DEADLINE
      </span>
    </div>
    <div className="space-y-1">
      <p className="text-base font-bold text-on-surface">{stat.date}</p>
      <p className="text-sm text-stone-500">{stat.daysRemaining} days remaining</p>
    </div>
  </div>
);

// ── Shortcuts Card ────────────────────────────────────────────

interface ShortcutsCardProps {
  onViewShortcuts?: () => void;
}

const ShortcutsCard = ({ onViewShortcuts }: ShortcutsCardProps) => (
  <div className="md:col-span-2 bg-primary p-6 border border-stone-200 rounded-xl shadow-md text-white flex justify-between items-center relative overflow-hidden">
    <div className="relative z-10">
      <h3 className="text-xl font-medium mb-2">Bulk Entry Shortcut</h3>
      <p className="text-sm opacity-90 max-w-xs">
        Use Tab and Arrow keys to navigate cells faster. Ctrl+S to quick-save your progress.
      </p>
    </div>
    <button
      onClick={onViewShortcuts}
      className="relative z-10 bg-white/10 hover:bg-white/20 border border-white/30 px-4 py-2 rounded text-sm font-bold backdrop-blur-md transition-all"
    >
      View Shortcuts
    </button>
    <span
      className="material-symbols-outlined absolute -right-6 -bottom-6 text-9xl opacity-10 select-none"
      aria-hidden="true"
    >
      keyboard
    </span>
  </div>
);

// ── Main Component ────────────────────────────────────────────

interface DocenteStatsGridProps {
  gradingProgress: GradingProgressStat;
  deadline: DeadlineStat;
  onViewShortcuts?: () => void;
}

const DocenteStatsGrid = ({
  gradingProgress,
  deadline,
  onViewShortcuts,
}: DocenteStatsGridProps) => (
  <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <GradingProgressCard stat={gradingProgress} />
    <DeadlineCard stat={deadline} />
    <ShortcutsCard onViewShortcuts={onViewShortcuts} />
  </section>
);

export default DocenteStatsGrid;