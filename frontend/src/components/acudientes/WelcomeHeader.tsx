// Single Responsibility: renders the welcome heading and child selector

import Icon from '../ui/Icon';
import type { Child } from '../../types/acudientes';

// ── Child Button ──────────────────────────────────────────────

interface ChildButtonProps {
  child: Child;
  isActive: boolean;
  onClick: (id: string) => void;
}

const ChildButton = ({ child, isActive, onClick }: ChildButtonProps) => (
  <button
    onClick={() => onClick(child.id)}
    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all
      ${isActive
        ? 'bg-primary-fixed-dim/30 border-2 border-primary ring-offset-2'
        : 'hover:bg-stone-50 border-2 border-transparent opacity-60 hover:opacity-100'
      }`}
  >
    <img
      src={child.avatarUrl}
      alt={child.name}
      className="w-8 h-8 rounded-full object-cover"
    />
    <span className={`font-semibold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
      {child.name}
    </span>
  </button>
);

const AddChildButton = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    aria-label="Add child"
    className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-dashed border-stone-300 text-stone-400 hover:text-primary hover:border-primary transition-all"
  >
    <Icon name="add" />
  </button>
);

// ── Main Component ────────────────────────────────────────────

interface WelcomeHeaderProps {
  parentFirstName: string;
  children: Child[];
  activeChildId: string;
  onSelectChild: (id: string) => void;
  onAddChild?: () => void;
}

const WelcomeHeader = ({
  parentFirstName,
  children,
  activeChildId,
  onSelectChild,
  onAddChild,
}: WelcomeHeaderProps) => (
  <section className="mb-10">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      {/* Greeting */}
      <div>
        <h2 className="text-3xl font-semibold text-primary mb-2">
          Welcome back, {parentFirstName}
        </h2>
        <p className="text-base text-on-surface-variant">
          Manage your children's academic life and stay updated with the latest
          institutional news.
        </p>
      </div>

      {/* Child Selector */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-stone-200 flex gap-2">
        {children.map((child) => (
          <ChildButton
            key={child.id}
            child={child}
            isActive={child.id === activeChildId}
            onClick={onSelectChild}
          />
        ))}
        <AddChildButton onClick={onAddChild} />
      </div>
    </div>
  </section>
);

export default WelcomeHeader;