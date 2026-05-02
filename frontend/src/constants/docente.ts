import type {
  TeacherProfile,
  CourseOption,
  GradeColumn,
  StudentRow,
  GradingProgressStat,
  DeadlineStat,
} from '../types/docente';

// ── Teacher ───────────────────────────────────────────────────

export const TEACHER_PROFILE: TeacherProfile = {
  name: 'Prof. Elena Rossi',
  title: 'Senior Instructor',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDAH4R5Gbrivwb6GxXfT-rx1AROQaofBp7PTsb25Bgi5_DaoEGAyMOHPiMoCnb5KshjAsLU_en-TOXcNvGB6rwX-dmCFcoLREWVBYYcJ3xtq1zMHBB_sHvrUm_K82UZ0I2ZGmSBTqKjFHTaPEBta6ohIfY8jwzHvAo8EhX6CLKnQ-fpgs7omrjHT7o2kYO-AILOnEGplXDgh8nGEnv-XQp-ixiibWRGX2HUV1ptexqaiV2mkUbeVPQEqH-nNjPBMbmAMtybyaKOZY8',
};

// ── Periods ───────────────────────────────────────────────────

export const PERIODS = [
  'First Quarter',
  'Second Quarter',
  'Third Quarter',
  'Fourth Quarter',
] as const;

// ── Course Options ────────────────────────────────────────────

export const COURSE_OPTIONS: CourseOption[] = [
  { id: '10a-math', label: '10A - Mathematics' },
  { id: '10b-math', label: '10B - Mathematics' },
  { id: '11a-algebra', label: '11A - Advanced Algebra' },
  { id: '12c-statistics', label: '12C - Statistics' },
];

// ── Grade Columns ─────────────────────────────────────────────

export const GRADE_COLUMNS: GradeColumn[] = [
  { key: 'exam1', label: 'EXAM 1', weight: 30 },
  { key: 'quiz1', label: 'QUIZ 1', weight: 20 },
  { key: 'project', label: 'PROJECT', weight: 35 },
  { key: 'participation', label: 'PARTICIPATION', weight: 15 },
];

// ── Students ──────────────────────────────────────────────────

export const INITIAL_STUDENTS: StudentRow[] = [
  {
    id: 'student-1',
    index: 1,
    name: 'Alex Thompson',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3_X4t5263hmdbmVpvjEMKoAWGbRXdqJ-eemNkzzaO88Z8RM0Ajl3DLo9YVoQgpaQjL51r7RvACbETzAKuhgfxuJnNtD6q7CfURoEUhTRmi2eBpnsDTo9MlUlT45dU7YvuxJ7i2uXNxuaRXziVM4JjVlM3nkZVMgQ8NLdOmpGPQY4ApxW6Amr6anbQhaQfuMTYphslpufVe4I6QFgn5qge_aH5waj_yMkBnSxgSr7MAp1g9dRTAI2WSIXbvZADs1kmpf9Zxe7hbck',
    grades: { exam1: 85, quiz1: 92, project: 88, participation: 100 },
    finalGrade: 89.5,
  },
  {
    id: 'student-2',
    index: 2,
    name: 'Beatriz Ramos',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3bAuB4rH7f-Jyx256bpn7hclu8pB1wAGnlR21TGg1yrRhMPH-N70HKdG567yj-Qc6VGWQlLR2KZOdgI-mIWScB8PotkCLhNBPbGvtdZ6h4nW87B1rUizYzhnEcqe2-32fakLhebUIpOBE5cz3enjsALXBoVfAuCB7PZg_ILfo_xPMiFsrsnUaS26P8j6C0AjA4axkqMna_cZNVL2vzms5EZhYVQgWdWd7vDCsP1pZXI1ZquO5vebeyvozWF6o603NhWAlxf_Ir8c',
    grades: { exam1: 76, quiz1: 80, project: 91, participation: 85 },
    finalGrade: 83.7,
  },
  {
    id: 'student-3',
    index: 3,
    name: 'Carlos Jimenez',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCN6dXxGzxSlJ_5Kt8zU24sShlm4P2LPFb2VYWm-OfTKH8fZ9Qs6JqfJQZIJDHa3oDeFLNTQOZ4hPZFoJfOdIbJmKYo5MlX2dxMvlXCDXCmW5UxqLq7U_rPagCXIuQ_7JpxE8U8sO3-VhtEzJn9KkGj9zk_TN4mNAD4FKGGNbvSNx5TBmqTMlrjHdBcgvMzZ5Ss0UMrqLQJi5KvHJnqXLVgMvFOVqHTajHT_SDkFvBkm4OVhyGm0J-VLHQ7o1ZkL7oqoNh8Ycw4',
    grades: { exam1: 92, quiz1: 88, project: 95, participation: 90 },
    finalGrade: 91.9,
  },
  {
    id: 'student-4',
    index: 4,
    name: 'Diana Patel',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBjvz7l5BpQy1UzNnKYSiDw3x0F-2sFbm7JKOlBXYq0lHhbFBz5I8a8MtnBG4n2t5Z8Ql7YHdBvChQ1cWA2MZKx_RFzHGR4VLZqNaMkSOkjI5rGK2nwz6ZKrA4eJ3HwA4jLuCjlH1xYy5OP7PU8rLzRYc6mwJpZsQ9pMJWnBSO_JreMiNW5KFxBa3e7UpW6Nh3t4gy-8s0mVZ7hJMRJF5H1DJRGbL2w8xTqJW5cLVYzG8mECeKLVTMYi_g',
    grades: { exam1: 58, quiz1: 65, project: 70, participation: 72 },
    finalGrade: 65.5,
  },
  {
    id: 'student-5',
    index: 5,
    name: 'Ethan Brooks',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCMm3MqQHpY1zNKJl8_x2FaX7W2vZ0KVv7dn4y8zRdP7KvHD4lMJPt3J6wXqYxM5HaDqB0l4eJb3gXCzX0hg5mNBKqJnL2P4wK8aRmF9Qb2jz6D1vR7gN3hTdJ_5vXQ_cYiMJ4kBzC9pF7jYQ5gL0bH8mZ3fI2nNpR6sO1dW4cE7lJ9tK_0yP2uV8xB1wN3eG6qH5kL4mT7rS0oP',
    grades: { exam1: '', quiz1: '', project: '', participation: '' },
    finalGrade: null,
  },
];

// ── Stats ─────────────────────────────────────────────────────

export const GRADING_PROGRESS: GradingProgressStat = {
  percentage: 88,
  deltaLabel: '+12% vs Yesterday',
};

export const SUBMISSION_DEADLINE: DeadlineStat = {
  date: 'Oct 24, 2023',
  daysRemaining: 3,
};