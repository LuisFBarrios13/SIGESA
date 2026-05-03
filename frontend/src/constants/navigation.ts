// src/constants/navigation.ts
import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',        icon: 'dashboard',   href: '/',           isActive: false },
  { id: 'enrollment', label: 'Nueva Matrícula',   icon: 'how_to_reg',  href: '/matricula',  isActive: false },
  { id: 'docentes',   label: 'Docentes',          icon: 'person_book', href: '/docentes',   isActive: false },
  { id: 'grades',     label: 'Notas Académicas',  icon: 'grade',       href: '#',           isActive: false },
  { id: 'financials', label: 'Financiero',        icon: 'payments',    href: '#',           isActive: false },
  { id: 'students',   label: 'Estudiantes',       icon: 'group',       href: '#',           isActive: false },
  { id: 'reports',    label: 'Reportes',          icon: 'analytics',   href: '#',           isActive: false },
];

export const NAV_FOOTER_ITEMS: NavItem[] = [
  { id: 'help',   label: 'Ayuda',         icon: 'help',   href: '#' },
  { id: 'logout', label: 'Cerrar Sesión', icon: 'logout', href: '/logout' },
];