// src/constants/navigation.ts
// Menú de cada rol. En el celular, la barra inferior muestra los ítems con
// enBarraMovil (o todos si son pocos) y el resto queda en «Más».
import type { NavItem } from '../types';

// ── ADMINISTRADOR ─────────────────────────────────────────────
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',         corto: 'Inicio',      icon: 'dashboard',   href: '/',            enBarraMovil: true },
  { id: 'enrollment', label: 'Nueva Matrícula',   corto: 'Matrícula',   icon: 'how_to_reg',  href: '/matricula' },
  { id: 'students',   label: 'Estudiantes',       corto: 'Estudiantes', icon: 'group',       href: '/estudiantes', enBarraMovil: true },
  { id: 'docentes',   label: 'Docentes',          corto: 'Docentes',    icon: 'person_book', href: '/docentes' },
  { id: 'pagos',      label: 'Pagos',             corto: 'Pagos',       icon: 'payments',    href: '/pagos',       enBarraMovil: true },
  { id: 'deudores',   label: 'Deudores',          corto: 'Deudores',    icon: 'warning',     href: '/deudores' },
];

// ── DOCENTE ───────────────────────────────────────────────────
export const NAV_ITEMS_DOCENTE: NavItem[] = [
  { id: 'mi-grado', label: 'Mi Grado',          corto: 'Mi grado', icon: 'class', href: '/docente' },
  { id: 'notas',    label: 'Registro de Notas', corto: 'Notas',    icon: 'grade', href: '/docente/notas' },
];

// ── ACUDIENTE ─────────────────────────────────────────────────
export const NAV_ITEMS_ACUDIENTE: NavItem[] = [
  { id: 'pagos', label: 'Mis pagos', corto: 'Pagos', icon: 'payments', href: '/acudiente' },
];

/** Ítems del menú según el rol (administrador por defecto). */
export const navegacionDe = (rol: string | undefined): NavItem[] =>
  rol === 'DOCENTE'   ? NAV_ITEMS_DOCENTE   :
  rol === 'ACUDIENTE' ? NAV_ITEMS_ACUDIENTE :
                        NAV_ITEMS;

// Menú anterior (components/layout/Sidebar); se elimina al pasar todo a AppLayout.
export const NAV_FOOTER_ITEMS: NavItem[] = [
  { id: 'help',   label: 'Ayuda',         icon: 'help',   href: '#'       },
  { id: 'logout', label: 'Cerrar Sesión', icon: 'logout', href: '/logout' },
];

/** Rutas raíz: solo se marcan activas en su ruta exacta. */
export const RUTAS_EXACTAS = new Set(['/', '/docente', '/acudiente']);

export const NOMBRE_ROL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  DOCENTE:       'Docente',
  ACUDIENTE:     'Acudiente',
};
