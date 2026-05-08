// src/components/layout/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import type { NavItem } from '../../types';
import {
  NAV_ITEMS,
  NAV_ITEMS_DOCENTE,
  NAV_ITEMS_ACUDIENTE,
  NAV_FOOTER_ITEMS,
} from '../../constants/navigation';
import { useAuth } from '../../hooks/useAuth';

// ── Nav Link ──────────────────────────────────────────────────

interface SidebarLinkProps {
  item:    NavItem;
  onClick?: () => void;
}

const SidebarLink = ({ item, onClick }: SidebarLinkProps) => {
  const isLogout = item.id === 'logout';

  if (isLogout) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center px-4 py-3 my-1 mx-2 rounded-md transition-all
          text-orange-100/70 hover:text-white hover:bg-orange-800/30"
        style={{ width: 'calc(100% - 1rem)' }}
      >
        <Icon name={item.icon} className="mr-3" />
        <span>{item.label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={item.href}
      end={item.href === '/' || item.href === '/docente' || item.href === '/acudiente'}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 my-1 mx-2 rounded-md transition-all duration-200 ease-in-out active:scale-95 ${
          isActive
            ? 'bg-orange-800/50 text-white border-l-4 border-emerald-500'
            : 'text-orange-100/70 hover:text-white hover:bg-orange-800/30'
        }`
      }
    >
      <Icon name={item.icon} className="mr-3" />
      <span>{item.label}</span>
    </NavLink>
  );
};

// ── Sidebar ───────────────────────────────────────────────────

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Selecciona los items de navegación según el rol
  const rol = user?.roles[0];
  const navItems =
    rol === 'DOCENTE'   ? NAV_ITEMS_DOCENTE   :
    rol === 'ACUDIENTE' ? NAV_ITEMS_ACUDIENTE :
                          NAV_ITEMS;           // ADMINISTRADOR por defecto

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col z-50 overflow-y-auto
      bg-orange-900 font-sans text-sm font-semibold tracking-wide
      border-r border-orange-800 shadow-xl">

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

      {/* User pill */}
      {user && (
        <div className="mx-4 mb-4 px-3 py-2.5 bg-orange-800/50 rounded-lg">
          <p className="text-white text-xs font-bold truncate">{user.username}</p>
          <p className="text-orange-200/60 text-[11px] uppercase tracking-wide mt-0.5">
            {rol ?? 'Usuario'}
          </p>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 mt-2">
        {navItems.map((item) => (
          <SidebarLink key={item.id} item={item} />
        ))}
      </nav>

      {/* Footer Nav */}
      <div className="p-4 border-t border-orange-800">
        {NAV_FOOTER_ITEMS.map((item) => (
          <SidebarLink
            key={item.id}
            item={item}
            onClick={item.id === 'logout' ? handleLogout : undefined}
          />
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;