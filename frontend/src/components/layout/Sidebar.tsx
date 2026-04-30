// Single Responsibility: renders sidebar navigation only

import Icon from '../ui/Icon';
import type { NavItem } from '../../types';
import { NAV_ITEMS, NAV_FOOTER_ITEMS } from '../../constants/navigation';

// ── Sub-components (Interface Segregation) ────────────────────

interface NavLinkProps {
  item: NavItem;
}

const NavLink = ({ item }: NavLinkProps) => {
  const activeClasses =
    'bg-orange-800/50 text-white border-l-4 border-emerald-500';
  const inactiveClasses =
    'text-orange-100/70 hover:text-white hover:bg-orange-800/30';

  return (
    <a
      href={item.href}
      className={`flex items-center px-4 py-3 my-1 mx-2 rounded-md transition-all duration-200 ease-in-out active:scale-95
        ${item.isActive ? activeClasses : inactiveClasses}`}
    >
      <Icon name={item.icon} className="mr-3" />
      <span>{item.label}</span>
    </a>
  );
};

interface NavSectionProps {
  items: NavItem[];
}

const NavSection = ({ items }: NavSectionProps) => (
  <>
    {items.map((item) => (
      <NavLink key={item.id} item={item} />
    ))}
  </>
);

// ── Main Component ────────────────────────────────────────────

const Sidebar = () => (
  <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col z-50 overflow-y-auto bg-orange-900 font-sans text-sm font-semibold tracking-wide border-r border-orange-800 shadow-xl">
    {/* Brand */}
    <div className="p-6 flex flex-col items-center">
      <div className="w-16 h-16 rounded-xl bg-orange-800 flex items-center justify-center mb-4">
        <Icon name="school" className="text-white text-3xl" />
      </div>
      <h1 className="text-2xl font-black text-white">SIGESA</h1>
      <p className="text-xs text-orange-200/60 uppercase tracking-widest mt-1">
        Management Portal
      </p>
    </div>

    {/* Main Nav */}
    <nav className="flex-1 mt-4">
      <NavSection items={NAV_ITEMS} />
    </nav>

    {/* Footer Nav */}
    <div className="p-4 border-t border-orange-800">
      <NavSection items={NAV_FOOTER_ITEMS} />
    </div>
  </aside>
);

export default Sidebar;