// Single Responsibility: renders the recent activity data table

import Icon from '../ui/Icon';
import type { ActivityEntry, ActivityStatus } from '../../types';

// ── Status Badge (Open/Closed via config map) ─────────────────

const STATUS_STYLES: Record<ActivityStatus, string> = {
  COMPLETED: 'bg-secondary-container/40 text-on-secondary-container',
  PROCESSING: 'bg-tertiary-container/10 text-tertiary',
  PENDING: 'bg-stone-200 text-stone-600',
};

const StatusBadge = ({ status }: { status: ActivityStatus }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[status]}`}
  >
    {status}
  </span>
);

// ── Table Row ─────────────────────────────────────────────────

interface ActivityRowProps {
  entry: ActivityEntry;
}

const ActivityRow = ({ entry }: ActivityRowProps) => (
  <tr className="hover:bg-stone-50 transition-colors">
    <td className="px-6 py-4 text-stone-500 text-sm">{entry.timestamp}</td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-600">
          {entry.user.initials}
        </div>
        <div>
          <p className="text-sm font-bold">{entry.user.name}</p>
          <p className="text-[11px] text-stone-400">{entry.user.role}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-sm">{entry.action}</td>
    <td className="px-6 py-4">
      <StatusBadge status={entry.status} />
    </td>
    <td className="px-6 py-4">
      <button className="text-stone-400 hover:text-primary transition-colors">
        <Icon name="more_vert" />
      </button>
    </td>
  </tr>
);

// ── Main Component ────────────────────────────────────────────

interface ActivityTableProps {
  entries: ActivityEntry[];
  onFilter?: () => void;
  onViewAll?: () => void;
}

const TABLE_HEADERS = ['Timestamp', 'User', 'Action', 'Status', 'Action'];

const ActivityTable = ({ entries, onFilter, onViewAll }: ActivityTableProps) => (
  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50/50">
      <h3 className="text-xl font-medium text-primary">Recent Institutional Activity</h3>
      <button
        onClick={onFilter}
        className="p-2 hover:bg-white rounded border border-stone-200"
      >
        <Icon name="filter_list" className="text-stone-500" />
      </button>
    </div>

    {/* Table */}
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider">
            {TABLE_HEADERS.map((h) => (
              <th key={h} className="px-6 py-4 border-b border-stone-100 text-xs">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {entries.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>

    {/* Footer */}
    <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-center">
      <button
        onClick={onViewAll}
        className="text-primary font-bold text-sm hover:underline"
      >
        See full activity log
      </button>
    </div>
  </div>
);

export default ActivityTable;