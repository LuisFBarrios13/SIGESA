// src/constants/navigation.ts
import type { NavItem } from '../types';

// ── ADMINISTRADOR ─────────────────────────────────────────────
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',        icon: 'dashboard',   href: '/',            isActive: false },
  { id: 'enrollment', label: 'Nueva Matrícula',   icon: 'how_to_reg',  href: '/matricula',   isActive: false },
  { id: 'docentes',   label: 'Docentes',          icon: 'person_book', href: '/docentes',    isActive: false },
  { id: 'pagos',      label: 'Pagos',             icon: 'payments',    href: '/pagos',       isActive: false },
  { id: 'deudores',   label: 'Deudores',          icon: 'warning',     href: '/deudores',    isActive: false },
  { id: 'students',   label: 'Estudiantes',       icon: 'group',       href: '/estudiantes', isActive: false },
];

// ── DOCENTE ───────────────────────────────────────────────────
export const NAV_ITEMS_DOCENTE: NavItem[] = [
  { id: 'mi-grado', label: 'Mi Grado',          icon: 'class', href: '/docente',       isActive: false },
  { id: 'notas',    label: 'Registro de Notas', icon: 'grade', href: '/docente/notas', isActive: false },
];

// ── ACUDIENTE ─────────────────────────────────────────────────
export const NAV_ITEMS_ACUDIENTE: NavItem[] = [
  { id: 'inicio', label: 'Inicio',    icon: 'home',     href: '/acudiente',       isActive: false },
  { id: 'pagos',  label: 'Mis Pagos', icon: 'payments', href: '/acudiente/pagos', isActive: false },
];

// ── Footer — común a todos los roles ─────────────────────────
export const NAV_FOOTER_ITEMS: NavItem[] = [
  { id: 'help',   label: 'Ayuda',         icon: 'help',   href: '#'       },
  { id: 'logout', label: 'Cerrar Sesión', icon: 'logout', href: '/logout' },
];