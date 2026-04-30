import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '#', isActive: true },
  { id: 'enrollment', label: 'Enrollment', icon: 'school', href: '#' },
  { id: 'grades', label: 'Academic Grades', icon: 'grade', href: '#' },
  { id: 'financials', label: 'Financials', icon: 'payments', href: '#' },
  { id: 'students', label: 'Students', icon: 'group', href: '#' },
  { id: 'reports', label: 'Reports', icon: 'analytics', href: '#' },
];

export const NAV_FOOTER_ITEMS: NavItem[] = [
  { id: 'help', label: 'Help Center', icon: 'help', href: '#' },
  { id: 'logout', label: 'Logout', icon: 'logout', href: '#' },
];