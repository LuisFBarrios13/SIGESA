// Single Responsibility: renders the top app bar

import Icon from '../ui/Icon';
import type { UserProfile } from '../../types';

interface TopBarProps {
  user: UserProfile;
  onSearch?: (query: string) => void;
}

// ── Sub-components (Interface Segregation) ────────────────────

const SearchInput = ({ onSearch }: { onSearch?: (q: string) => void }) => (
  <div className="relative">
    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
      <Icon name="search" className="text-lg" />
    </span>
    <input
      type="text"
      placeholder="Search records..."
      onChange={(e) => onSearch?.(e.target.value)}
      className="bg-stone-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all outline-none"
    />
  </div>
);

const ActionButtons = () => (
  <div className="flex items-center gap-4 text-stone-500">
    <button className="hover:bg-stone-50 p-2 rounded-full transition-colors active:opacity-80">
      <Icon name="notifications" />
    </button>
    <button className="hover:bg-stone-50 p-2 rounded-full transition-colors active:opacity-80">
      <Icon name="settings" />
    </button>
  </div>
);

// DESPUÉS
const UserAvatar = ({ user }: { user: UserProfile }) => {
  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex items-center gap-3 cursor-pointer">
      <div className="text-right">
        <p className="text-sm font-bold text-orange-900">{user.name}</p>
        <p className="text-[10px] text-stone-400 uppercase font-bold">{user.role}</p>
      </div>
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={`${user.name} profile photo`}
          className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-orange-900 border-2 border-primary/20
          flex items-center justify-center">
          <span className="text-xs font-black text-white">{initials}</span>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────

const TopBar = ({ user, onSearch }: TopBarProps) => (
  <header className="sticky top-0 z-40 w-full flex justify-between items-center px-6 h-16 bg-white border-b border-stone-200 shadow-sm font-sans antialiased text-sm font-medium">
    <SearchInput onSearch={onSearch} />

    <div className="flex items-center gap-6">
      <ActionButtons />
      <div className="h-8 w-px bg-stone-200" />
      <UserAvatar user={user} />
    </div>
  </header>
);

export default TopBar;