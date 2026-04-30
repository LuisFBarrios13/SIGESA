// ============================================================
// Acudientes Domain Types — Single Responsibility per entity
// ============================================================

// ── Children ──────────────────────────────────────────────────

export interface Child {
  id: string;
  name: string;
  avatarUrl: string;
  grade: string;
  section: string;
}

// ── Grades ────────────────────────────────────────────────────

export type GradeTrend = 'trending_up' | 'trending_flat' | 'trending_down';
export type TrendColor = 'text-secondary' | 'text-stone-400' | 'text-error';

export interface SubjectGrade {
  id: string;
  subject: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  score: number;
  maxScore: number;
  trend: GradeTrend;
  trendColor: TrendColor;
}

// ── Financial ─────────────────────────────────────────────────

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface FinancialItem {
  id: string;
  description: string;
  status: PaymentStatus;
}

export interface OverdueAlert {
  message: string;
  dueDate: string;
}

// ── Attendance ────────────────────────────────────────────────

export interface AttendanceData {
  percentage: number;
  missedDays: number;
  studentName: string;
  period: string;
}

// ── Events & Notices ──────────────────────────────────────────

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  hoverTextColor: string;
}

// ── Parent Profile ────────────────────────────────────────────

export interface ParentProfile {
  name: string;
  avatarUrl: string;
  role: string;
}