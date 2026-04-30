// Single Responsibility: renders the attendance bar widget

import type { AttendanceData } from '../../types/acudientes';

// ── Attendance Bar ────────────────────────────────────────────

interface AttendanceBarProps {
  percentage: number;
}

const AttendanceBar = ({ percentage }: AttendanceBarProps) => (
  <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-2">
    <div
      className="bg-secondary h-full rounded-full transition-all"
      style={{ width: `${percentage}%` }}
    />
    <div
      className="bg-error h-full"
      style={{ width: `${100 - percentage}%` }}
    />
  </div>
);

// ── Main Component ────────────────────────────────────────────

interface AttendanceWidgetProps {
  data: AttendanceData;
}

const AttendanceWidget = ({ data }: AttendanceWidgetProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
    <div className="flex justify-between items-center mb-4">
      <h4 className="font-semibold text-on-surface">Attendance</h4>
      <span className="text-xs bg-secondary-container/20 text-secondary px-2 py-0.5 rounded-full font-bold">
        {data.percentage}% Regular
      </span>
    </div>

    <AttendanceBar percentage={data.percentage} />

    <p className="text-[11px] text-stone-500 mt-1">
      {data.studentName} has missed {data.missedDays}{' '}
      {data.missedDays === 1 ? 'day' : 'days'} this {data.period}.
    </p>
  </div>
);

export default AttendanceWidget;