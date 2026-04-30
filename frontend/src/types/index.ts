// ============================================================
// Domain Types — Single Responsibility per domain entity
// ============================================================

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  isActive?: boolean;
}

// ── Metric Cards ──────────────────────────────────────────────

export type BadgeVariant = 'success' | 'error' | 'warning' | 'neutral' | 'info';
export type CardVariant = 'default' | 'alert';

export interface MetricBadge {
  text: string;
  variant: BadgeVariant;
}

export interface MetricCardData {
  id: string;
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  badge?: MetricBadge;
  /** Progress bar value 0–100 */
  progress?: number;
  variant?: CardVariant;
}

// ── Tasks ─────────────────────────────────────────────────────

export type TaskPriority = 'high' | 'standard' | 'new';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  icon: string;
  iconBg: string;
  iconColor: string;
}

// ── Activity Table ────────────────────────────────────────────

export type ActivityStatus = 'COMPLETED' | 'PROCESSING' | 'PENDING';

export interface ActivityUser {
  initials: string;
  name: string;
  role: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  user: ActivityUser;
  action: string;
  status: ActivityStatus;
}

// ── Financial Chart ───────────────────────────────────────────

export interface ChartDataPoint {
  month: string;
  /** Fraction 0–1 relative to tallest bar */
  revenueRatio: number;
  expensesRatio: number;
}

// ── User Profile ──────────────────────────────────────────────

export interface UserProfile {
  name: string;
  role: string;
  avatarUrl: string;
}