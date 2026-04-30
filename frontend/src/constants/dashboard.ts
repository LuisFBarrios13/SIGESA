import type {
  MetricCardData,
  Task,
  ActivityEntry,
  ChartDataPoint,
  UserProfile,
} from '../types';

// ── User ──────────────────────────────────────────────────────

export const CURRENT_USER: UserProfile = {
  name: 'Admin User',
  role: 'Principal Office',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBO1ah7WFVxHxD64t_EaFk9JW7voR1lOjibdqk1givSN5kP3ABQjmYmkYcYcpZiSV3BZM6OWtKuc6i88pRzvelqR4TZB_WqrHKQi2QqMEa_AhksaJnZYZv-WSTjeJoyaMhsp2CLlGj7DK7pJ4vgrO4rPErQi5dd-cxO9m-DMSo6qhvUvNwz1jntAsmMvsz5w5HlIhA0wsp0XP1T9hxbZ8YaKAsro9fZoYBOybTPLGg_fxj8iW1EfwNVpNwsyCwSHLhoPC4G18DMZXc',
};

// ── Metric Cards ──────────────────────────────────────────────

export const METRIC_CARDS: MetricCardData[] = [
  {
    id: 'total-students',
    label: 'TOTAL STUDENTS',
    value: '1,284',
    icon: 'group',
    iconBg: 'bg-primary-fixed',
    iconColor: 'text-on-primary-fixed-variant',
    badge: { text: '+12%', variant: 'success' },
  },
  {
    id: 'enrollment-status',
    label: 'ENROLLMENT STATUS',
    value: '94%',
    icon: 'how_to_reg',
    iconBg: 'bg-tertiary-fixed',
    iconColor: 'text-tertiary',
    badge: { text: 'Active', variant: 'neutral' },
    progress: 94,
  },
  {
    id: 'monthly-revenue',
    label: 'MONTHLY REVENUE',
    value: '$45,280.00',
    icon: 'payments',
    iconBg: 'bg-secondary-fixed',
    iconColor: 'text-on-secondary-container',
    badge: { text: '-3.2%', variant: 'error' },
  },
  {
    id: 'delinquency-alerts',
    label: 'DELINQUENCY ALERTS',
    value: '24 Cases',
    icon: 'warning',
    iconBg: 'bg-error-container',
    iconColor: 'text-error',
    badge: { text: 'Action Required', variant: 'error' },
    variant: 'alert',
  },
];

// ── Chart Data ────────────────────────────────────────────────

export const CHART_DATA: ChartDataPoint[] = [
  { month: 'JAN', revenueRatio: 0.8, expensesRatio: 0.6 },
  { month: 'FEB', revenueRatio: 1.0, expensesRatio: 0.67 },
  { month: 'MAR', revenueRatio: 0.83, expensesRatio: 0.5 },
  { month: 'APR', revenueRatio: 0.75, expensesRatio: 0.8 },
  { month: 'MAY', revenueRatio: 1.0, expensesRatio: 0.67 },
  { month: 'JUN', revenueRatio: 0.83, expensesRatio: 0.75 },
];

// ── Pending Tasks ─────────────────────────────────────────────

export const PENDING_TASKS: Task[] = [
  {
    id: 'grade-validation',
    title: 'Grade Validation',
    description: 'Approve final grades for Grade 10B',
    priority: 'high',
    icon: 'assignment',
    iconBg: 'bg-error-container',
    iconColor: 'text-error',
  },
  {
    id: 'invoice-review',
    title: 'Invoice Review',
    description: 'Check outstanding vendor payments',
    priority: 'standard',
    icon: 'receipt_long',
    iconBg: 'bg-tertiary-container',
    iconColor: 'text-white',
  },
  {
    id: 'teacher-onboarding',
    title: 'New Teacher Onboarding',
    description: 'Complete HR profile for Sarah Miller',
    priority: 'new',
    icon: 'person_add',
    iconBg: 'bg-secondary',
    iconColor: 'text-white',
  },
];

// ── Activity Log ──────────────────────────────────────────────

export const ACTIVITY_LOG: ActivityEntry[] = [
  {
    id: 'act-1',
    timestamp: '2023-11-24 09:15 AM',
    user: { initials: 'JS', name: 'John Smith', role: 'Registrar' },
    action: 'Student Enrollment - Maria Garcia',
    status: 'COMPLETED',
  },
  {
    id: 'act-2',
    timestamp: '2023-11-24 08:42 AM',
    user: { initials: 'RT', name: 'Robert T.', role: 'Treasurer' },
    action: 'Batch Payment Processing',
    status: 'PROCESSING',
  },
  {
    id: 'act-3',
    timestamp: '2023-11-23 04:55 PM',
    user: { initials: 'AM', name: 'Alice Miller', role: 'Academic Dir.' },
    action: 'Updated Curriculum - Grade 12',
    status: 'COMPLETED',
  },
];