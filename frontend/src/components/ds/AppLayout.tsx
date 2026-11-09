// src/components/ds/AppLayout.tsx
// Estructura común a todos los roles:
//   - Escritorio (≥ lg): menú lateral blanco con el escudo.
//   - Celular: barra inferior fija; si el rol tiene muchos ítems, los demás van en «Más».
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { NavItem } from '../../types';
import { navegacionDe, RUTAS_EXACTAS } from '../../constants/navigation';

const MAX_BARRA = 4;

const Icono = ({ nombre, className = '' }: { nombre: string; className?: string }) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>{nombre}</span>
);

// ── Menú lateral (escritorio) ─────────────────────────────────

const claseLateral = (activo: boolean) =>
  `flex items-center gap-3 min-h-12 px-3.5 rounded-[14px] text-[15px] transition-colors ${
    activo ? 'bg-vino-suave text-vino font-semibold' : 'text-tinta-media font-medium hover:bg-crema hover:text-tinta'
  }`;

const MenuLateral = ({ items, onSalir }: { items: NavItem[]; onSalir: () => void }) => (
  <aside className="hidden lg:flex sticky top-[3.25rem] h-[calc(100vh-6.5rem)] w-[260px] shrink-0 flex-col gap-7
    bg-tarjeta rounded-card-lg px-[18px] py-6 overflow-y-auto">
    <div className="flex items-center gap-3 px-1.5">
      <img src="/escudo-128.png" alt="Escudo Colegio Pedagógico San Agustín" width={44} height={44}
        className="w-11 h-11 rounded-full object-cover" />
      <div className="flex flex-col">
        <span className="text-[19px] font-semibold tracking-tight text-tinta">SIGESA</span>
        <span className="text-xs text-tinta-suave">San Agustín</span>
      </div>
    </div>

    <nav aria-label="Menú principal" className="flex flex-col gap-1.5">
      {items.map((it) => (
        <NavLink key={it.id} to={it.href} end={RUTAS_EXACTAS.has(it.href)}
          className={({ isActive }) => claseLateral(isActive)}>
          <Icono nombre={it.icon} className="text-[21px]" />
          {it.label}
        </NavLink>
      ))}
    </nav>

    <div className="flex-1" />

    <button type="button" onClick={onSalir} className={claseLateral(false)}>
      <Icono nombre="logout" className="text-[21px]" />
      Cerrar sesión
    </button>
  </aside>
);

// ── Barra inferior (celular) ──────────────────────────────────

const claseBarra = (activo: boolean) =>
  `min-h-14 rounded-[18px] flex flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight
   text-center transition-colors ${activo ? 'bg-vino-suave text-vino font-semibold' : 'text-tinta-media font-semibold'}`;

const BarraMovil = ({ items, onSalir }: { items: NavItem[]; onSalir: () => void }) => {
  const [masAbierto, setMasAbierto] = useState(false);
  const { pathname } = useLocation();

  // Pocos ítems: todos + «Salir». Muchos: los marcados (o los primeros) + «Más».
  const muchos   = items.length + 1 > MAX_BARRA;
  const visibles = muchos
    ? (items.some((i) => i.enBarraMovil) ? items.filter((i) => i.enBarraMovil) : items).slice(0, MAX_BARRA - 1)
    : items;
  const resto    = items.filter((i) => !visibles.includes(i));
  const masActivo = resto.some((i) => (RUTAS_EXACTAS.has(i.href) ? pathname === i.href : pathname.startsWith(i.href)));

  // Se cierra al navegar y con Escape
  const [rutaAnterior, setRutaAnterior] = useState(pathname);
  if (rutaAnterior !== pathname) { setRutaAnterior(pathname); setMasAbierto(false); }
  useEffect(() => {
    if (!masAbierto) return;
    const alPresionar = (e: KeyboardEvent) => { if (e.key === 'Escape') setMasAbierto(false); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [masAbierto]);

  const columnas = visibles.length + 1;

  return (
    <>
      {masAbierto && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMasAbierto(false)}>
          <div id="menu-mas" role="dialog" aria-modal="true" aria-label="Más opciones"
            onClick={(e) => e.stopPropagation()}
            className="absolute left-3.5 right-3.5 bottom-[calc(6rem+env(safe-area-inset-bottom))]
              bg-tarjeta rounded-card-lg p-2 shadow-barra flex flex-col gap-1">
            {resto.map((it) => (
              <NavLink key={it.id} to={it.href} end={RUTAS_EXACTAS.has(it.href)}
                className={({ isActive }) => claseLateral(isActive)}>
                <Icono nombre={it.icon} className="text-[21px]" />
                {it.label}
              </NavLink>
            ))}
            <div className="h-px bg-linea mx-2 my-1" />
            <button type="button" onClick={onSalir} className={claseLateral(false)}>
              <Icono nombre="logout" className="text-[21px]" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <nav aria-label="Menú principal"
        className="lg:hidden fixed z-50 left-3.5 right-3.5 bottom-[calc(1rem+env(safe-area-inset-bottom))]
          bg-tarjeta rounded-[24px] p-2 shadow-barra grid gap-1"
        style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
        {visibles.map((it) => (
          <NavLink key={it.id} to={it.href} end={RUTAS_EXACTAS.has(it.href)}
            className={({ isActive }) => claseBarra(isActive)}>
            <Icono nombre={it.icon} className="text-[21px]" />
            <span className="truncate max-w-full">{it.corto ?? it.label}</span>
          </NavLink>
        ))}
        {muchos ? (
          <button type="button" onClick={() => setMasAbierto((v) => !v)}
            aria-expanded={masAbierto} aria-controls="menu-mas"
            className={claseBarra(masAbierto || masActivo)}>
            <Icono nombre={masAbierto ? 'close' : 'menu'} className="text-[21px]" />
            Más
          </button>
        ) : (
          <button type="button" onClick={onSalir} className={claseBarra(false)}>
            <Icono nombre="logout" className="text-[21px]" />
            Salir
          </button>
        )}
      </nav>
    </>
  );
};

// ── Layout ────────────────────────────────────────────────────

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navegacionDe(user?.roles[0]);

  const salir = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-fondo-app text-tinta lg:p-8">
      {/* Escritorio: todo dentro de un recuadro crema sobre el fondo degradado */}
      <div className="mx-auto max-w-[1376px] lg:flex lg:gap-6 lg:p-5 lg:bg-crema lg:rounded-[36px] lg:min-h-[calc(100vh-4rem)]">
        <MenuLateral items={items} onSalir={salir} />
        <main className="flex-1 min-w-0 px-4 pt-5 pb-barra-movil sm:px-6 lg:px-1 lg:pt-2 lg:pb-8">
          <div className="flex flex-col gap-5 lg:gap-6">{children}</div>
        </main>
      </div>
      <BarraMovil items={items} onSalir={salir} />
    </div>
  );
};

export default AppLayout;
