// ============================================================
// Docente Domain Types — Single Responsibility per entity
// ============================================================

// ── Teacher Profile ───────────────────────────────────────────

export interface TeacherProfile {
  name: string;
  title: string;
  avatarUrl: string;
}

// ── Filters ───────────────────────────────────────────────────

export type Period = 'First Quarter' | 'Second Quarter' | 'Third Quarter' | 'Fourth Quarter';

export interface CourseOption {
  id: string;
  label: string;
}

// ── Grade Entry ───────────────────────────────────────────────

export interface GradeColumn {
  /** Machine-readable key matching StudentGrades keys */
  key: keyof StudentGrades;
  label: string;
  /** Weight as percentage, e.g. 30 for 30% */
  weight: number;
}

export interface StudentGrades {
  exam1: number | '';
  quiz1: number | '';
  project: number | '';
  participation: number | '';
}

export interface StudentRow {
  id: string;
  index: number;
  name: string;
  avatarUrl: string;
  grades: StudentGrades;
  /** Computed from grades + weights */
  finalGrade: number | null;
}

// ── Stats Cards ───────────────────────────────────────────────

export interface GradingProgressStat {
  percentage: number;
  deltaLabel: string;
}

export interface DeadlineStat {
  date: string;
  daysRemaining: number;
}