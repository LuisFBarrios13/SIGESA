// Single Responsibility: renders the pending tasks list

import Icon from '../ui/Icon';
import type { Task, TaskPriority } from '../../types';

// ── Priority Badge (Open/Closed via config map) ───────────────

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  high: 'bg-error-container text-error',
  standard: 'bg-stone-200 text-stone-600',
  new: 'bg-secondary-container/40 text-secondary',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'High Priority',
  standard: 'Standard',
  new: 'New',
};

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => (
  <span
    className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-black rounded uppercase
      ${PRIORITY_STYLES[priority]}`}
  >
    {PRIORITY_LABELS[priority]}
  </span>
);

// ── Task Item ─────────────────────────────────────────────────

interface TaskItemProps {
  task: Task;
}

const TaskItem = ({ task }: TaskItemProps) => (
  <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
    <div className={`p-2 ${task.iconBg} rounded-md flex-shrink-0`}>
      <Icon name={task.icon} className={`text-sm ${task.iconColor}`} />
    </div>
    <div>
      <p className="text-sm font-bold text-on-surface">{task.title}</p>
      <p className="text-xs text-stone-500">{task.description}</p>
      <PriorityBadge priority={task.priority} />
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────

interface PendingTasksProps {
  tasks: Task[];
  onViewAll?: () => void;
}

const PendingTasks = ({ tasks, onViewAll }: PendingTasksProps) => (
  <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-medium text-primary">Pending Tasks</h3>
      <button
        onClick={onViewAll}
        className="text-secondary text-xs font-bold hover:underline"
      >
        View All
      </button>
    </div>

    {/* List */}
    <div className="space-y-4 overflow-y-auto pr-1">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  </div>
);

export default PendingTasks;